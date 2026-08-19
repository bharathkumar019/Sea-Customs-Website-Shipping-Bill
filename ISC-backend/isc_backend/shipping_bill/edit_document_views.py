from django.db import transaction

from rest_framework import status
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ShippingBill,
    ShippingBillDocument,
)


# A Shipping Bill may be edited/uploaded by the Unit Maker while it is
# in one of the Maker-editable states, and by the Unit Approver while
# the bill is in an Approver-editable state.
MAKER_EDITABLE_STATUSES = {
    "DRAFT",
    "SENT_BACK",
    "QUERY_FORWARDED",
}

APPROVER_EDITABLE_STATUSES = {
    "SUBMITTED_TO_APPROVER",
    "QUERY_RAISED",
    "QUERY_RESPONDED",
    "MAKER_RESPONDED",
}


ALLOWED_DOCUMENT_TYPES = {

    "INVOICE_PACKAGE":
        "Invoice",

    "PL_DOCUMENT":
        "PL",

    "BL_DOCUMENT":
        "BL",
}


def get_bill(pk):

    try:

        return ShippingBill.objects.get(
            pk=pk
        )

    except ShippingBill.DoesNotExist:

        return None


def can_edit(
    request,
    bill
):

    # Unit Maker: only the maker who created the bill can upload/edit
    # documents during the Maker-editable states.
    if request.user.role == "UNIT_MAKER":
        return (
            bill.created_by_id == request.user.id
            and
            bill.status in MAKER_EDITABLE_STATUSES
        )

    # Unit Approver: the approver can upload documents for a bill that
    # belongs to the same company while the bill is in an Approver-editable
    # state. This matches the Approver form's existing Edit/Save workflow.
    if request.user.role == "UNIT_APPROVER":
        return (
            bill.company_id == request.user.company_id
            and
            bill.status in APPROVER_EDITABLE_STATUSES
        )

    return False


def serialize_document(
    request,
    document
):

    try:

        url = (
            document.file.url
            if document.file
            else None
        )

    except ValueError:

        url = None

    if url:

        # Normalize accidental duplicate media folder.
        duplicate_prefix = (
            "/shipping_bill_documents/"
            "shipping_bill_documents/"
        )
        correct_prefix = "/shipping_bill_documents/"

        while duplicate_prefix in url:
            url = url.replace(
                duplicate_prefix,
                correct_prefix,
                1,
            )

    if request and url:

        url = request.build_absolute_uri(
            url
        )

    return {

        "id":
            document.id,

        "document_type":
            document.document_type,

        "label":
            ALLOWED_DOCUMENT_TYPES.get(
                document.document_type,
                document.document_type
            ),

        "file_url":
            url,
    }


class EditableShippingBillDocumentView(
    APIView
):

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    # =====================================================
    # GET
    # =====================================================

    def get(
        self,
        request,
        pk
    ):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                        "Authentication required."
                },
                status=
                status.HTTP_401_UNAUTHORIZED
            )

        bill = get_bill(pk)

        if not bill:

            return Response(
                {
                    "error":
                        "Shipping Bill not found."
                },
                status=
                status.HTTP_404_NOT_FOUND
            )

        # The same Shipping Bill documents must remain visible to both
        # the Unit Maker and the Unit Approver throughout the workflow.
        can_view = False

        if request.user.role == "UNIT_MAKER":
            can_view = (
                bill.created_by_id == request.user.id
            )

        elif request.user.role == "UNIT_APPROVER":
            can_view = (
                bill.company_id == request.user.company_id
            )

        if not can_view:
            return Response(
                {
                    "error":
                        "You are not allowed to access these documents."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        documents = (
            bill.documents
            .all()
            .order_by(
                "document_type"
            )
        )

        return Response([
            serialize_document(
                request,
                document
            )
            for document in documents
        ])

    # =====================================================
    # POST
    # =====================================================

    @transaction.atomic
    def post(
        self,
        request,
        pk
    ):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                        "Authentication required."
                },
                status=
                status.HTTP_401_UNAUTHORIZED
            )

        bill = get_bill(pk)

        if not bill:

            return Response(
                {
                    "error":
                        "Shipping Bill not found."
                },
                status=
                status.HTTP_404_NOT_FOUND
            )

        if not can_edit(
            request,
            bill
        ):

            return Response(
                {
                    "error":
                        "This Shipping Bill cannot be edited now."
                },
                status=
                status.HTTP_400_BAD_REQUEST
            )

        document_type = str(
            request.data.get(
                "document_type"
            ) or ""
        ).strip()

        uploaded_file = (
            request.FILES.get("file")
        )

        if (
            document_type
            not in ALLOWED_DOCUMENT_TYPES
        ):

            return Response(
                {
                    "error":
                        "Invalid document type. Use Invoice, PL or BL."
                },
                status=
                status.HTTP_400_BAD_REQUEST
            )

        if not uploaded_file:

            return Response(
                {
                    "error":
                        "File is required."
                },
                status=
                status.HTTP_400_BAD_REQUEST
            )

        # 10 MB
        if uploaded_file.size > (
            10 * 1024 * 1024
        ):

            return Response(
                {
                    "error":
                        "File size cannot exceed 10 MB."
                },
                status=
                status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # CREATE DOCUMENT
        # -------------------------------------------------
        # Multiple documents of the same type are allowed.
        # Never replace an existing Invoice / PL / BL file.

        document = (
            ShippingBillDocument.objects.create(
                shipping_bill=bill,
                document_type=document_type,
                file=uploaded_file,
                uploaded_by=request.user,
            )
        )

        return Response(
            {
                "message":
                    f"{ALLOWED_DOCUMENT_TYPES[document_type]} document saved successfully.",

                "document":
                    serialize_document(
                        request,
                        document
                    ),
            },
            status=
            status.HTTP_200_OK
        )