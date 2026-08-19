from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    ShippingBill,
    ShippingBillDocument,
)

from .serializers import ShippingBillDocumentSerializer


# =========================================================
# HELPER
# =========================================================

def get_shipping_bill(pk):
    try:
        return ShippingBill.objects.get(pk=pk)

    except ShippingBill.DoesNotExist:
        return None


# =========================================================
# DOCUMENT LIST + UPLOAD
# =========================================================

class ShippingBillDocumentListCreateView(APIView):

    def get(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error": "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        documents = (
            ShippingBillDocument.objects
            .filter(shipping_bill=shipping_bill)
            .order_by("-uploaded_at")
        )

        serializer = ShippingBillDocumentSerializer(
            documents,
            many=True,
            context={"request": request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # =====================================================
    # UPLOAD
    # =====================================================

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error": "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.status not in {
            "DRAFT", "SENT_BACK", "QUERY_FORWARDED",
            "SUBMITTED_TO_APPROVER", "QUERY_RAISED",
            "QUERY_RESPONDED", "MAKER_RESPONDED",
            "SUBMITTED_TO_CUSTOMS",
        }:

            return Response(
                {
                    "error": "This Shipping Bill is locked and documents cannot be changed now."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        document_type = request.data.get(
            "document_type"
        )

        uploaded_file = request.FILES.get(
            "file"
        )

        # -------------------------------------------------
        # VALIDATE DOCUMENT TYPE
        # -------------------------------------------------

        allowed_types = [
            "INVOICE_PACKAGE",
            "PL_DOCUMENT",
            "BL_DOCUMENT",
        ]

        if document_type not in allowed_types:

            return Response(
                {
                    "error": (
                        "Invalid document type. "
                        "Allowed types are "
                        "INVOICE_PACKAGE, PL_DOCUMENT and BL_DOCUMENT."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # VALIDATE FILE
        # -------------------------------------------------

        if not uploaded_file:

            return Response(
                {
                    "error": "File is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # CHECK USER ACCESS
        # -------------------------------------------------

        if request.user.role == "UNIT_MAKER":

            if shipping_bill.created_by != request.user:

                return Response(
                    {
                        "error": (
                            "You are not allowed to "
                            "upload documents for this "
                            "Shipping Bill."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role == "UNIT_APPROVER":

            if shipping_bill.company != request.user.company:

                return Response(
                    {
                        "error": (
                            "You are not allowed to "
                            "access this Shipping Bill."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role not in [
            "DC_CUSTOMS",
            "AC_CUSTOMS",
        ]:

            return Response(
                {
                    "error": "You are not allowed to upload documents."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # CREATE DOCUMENT
        # -------------------------------------------------

        document = ShippingBillDocument.objects.create(
            shipping_bill=shipping_bill,
            document_type=document_type,
            file=uploaded_file,
            uploaded_by=request.user,
        )

        serializer = ShippingBillDocumentSerializer(
            document,
            context={"request": request}
        )

        return Response(
            {
                "message": "Document uploaded successfully.",
                "document": serializer.data,
            },
            status=status.HTTP_201_CREATED
        )


# =========================================================
# DOCUMENT DETAIL
# =========================================================

class ShippingBillDocumentDetailView(APIView):

    # =====================================================
    # GET
    # =====================================================

    def get(self, request, pk, document_id):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error": "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            document = (
                ShippingBillDocument.objects.get(
                    id=document_id,
                    shipping_bill=shipping_bill
                )
            )

        except ShippingBillDocument.DoesNotExist:

            return Response(
                {
                    "error": "Document not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ShippingBillDocumentSerializer(
            document,
            context={"request": request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # =====================================================
    # DELETE
    # =====================================================

    def delete(self, request, pk, document_id):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error": "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:

            document = (
                ShippingBillDocument.objects.get(
                    id=document_id,
                    shipping_bill=shipping_bill
                )
            )

        except ShippingBillDocument.DoesNotExist:

            return Response(
                {
                    "error": "Document not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # LOCK AFTER LET EXPORT
        # -------------------------------------------------

        if shipping_bill.status not in {
            "DRAFT", "SENT_BACK", "QUERY_FORWARDED",
            "SUBMITTED_TO_APPROVER", "QUERY_RAISED",
            "QUERY_RESPONDED", "MAKER_RESPONDED",
            "SUBMITTED_TO_CUSTOMS",
        }:

            return Response(
                {
                    "error": "This Shipping Bill is locked and documents cannot be deleted now."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # ONLY MAKER / APPROVER CAN DELETE
        # -------------------------------------------------

        if request.user.role == "UNIT_MAKER":

            if shipping_bill.created_by != request.user:

                return Response(
                    {
                        "error": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif request.user.role == "UNIT_APPROVER":

            if shipping_bill.company != request.user.company:

                return Response(
                    {
                        "error": "Permission denied."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        else:

            return Response(
                {
                    "error": (
                        "Only Unit Maker or Unit Approver "
                        "can delete documents."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # DELETE FILE
        # -------------------------------------------------

        if document.file:

            document.file.delete(
                save=False
            )

        document.delete()

        return Response(
            {
                "message": "Document deleted successfully."
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# UNIT APPROVER VERIFY DOCUMENT
# =========================================================

class VerifyShippingBillDocumentView(APIView):

    def post(
        self,
        request,
        pk,
        document_id
    ):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "UNIT_APPROVER":

            return Response(
                {
                    "error": (
                        "Only Unit Approver can "
                        "verify documents."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error": "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.company != request.user.company:

            return Response(
                {
                    "error": (
                        "You are not allowed to "
                        "access this Shipping Bill."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:

            document = (
                ShippingBillDocument.objects.get(
                    id=document_id,
                    shipping_bill=shipping_bill
                )
            )

        except ShippingBillDocument.DoesNotExist:

            return Response(
                {
                    "error": "Document not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.status not in {
            "SUBMITTED_TO_CUSTOMS", "QUERY_RESPONDED",
            "MAKER_RESPONDED", "SUBMITTED_TO_APPROVER",
            "QUERY_RAISED", "QUERY_FORWARDED",
        }:

            return Response(
                {
                    "error": "This Shipping Bill is locked and documents cannot be verified now."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # VERIFY
        # -------------------------------------------------

        document.verified_by_approver = True

        document.verified_at = timezone.now()

        document.verified_by = request.user

        document.save(
            update_fields=[
                "verified_by_approver",
                "verified_at",
                "verified_by",
            ]
        )

        serializer = ShippingBillDocumentSerializer(
            document,
            context={"request": request}
        )

        return Response(
            {
                "message": (
                    "Document verified successfully."
                ),
                "document": serializer.data,
            },
            status=status.HTTP_200_OK
        )