from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    ShippingBill,
    ShippingBillQuery,
    ShippingBillDocument,
)

from .serializers import (
    ShippingBillSerializer,
    ShippingBillDocumentSerializer,
)


# =========================================================
# HELPER
# =========================================================

def get_shipping_bill(pk):

    try:
        return ShippingBill.objects.get(pk=pk)

    except ShippingBill.DoesNotExist:
        return None


# =========================================================
# SHIPPING BILL LIST + CREATE
# =========================================================

class ShippingBillListCreateView(APIView):

    def get(self, request):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # =================================================
        # WORKFLOW HISTORY
        #
        # Once a Shipping Bill reaches a role's inbox, it must
        # remain visible in that role's Submitted / In Progress
        # section even after its status moves to the next stage.
        #
        # No model/migration changes are required.  We use the
        # existing ShippingBill.status field to determine whether
        # the SB has reached that workflow stage.
        # =================================================

        UNIT_APPROVER_HISTORY_STATUSES = [
            "SUBMITTED_TO_APPROVER",
            "QUERY_RAISED",
            "QUERY_FORWARDED",
            "QUERY_RESPONDED",
            "MAKER_RESPONDED",
            "SENT_BACK",
            "CANCELLED",
            "SUBMITTED_TO_CUSTOMS",
            "SUBMITTED_TO_AC",
            "EGM_SUBMITTED",
            "SHIPMENT_SUCCESS",
            "PROOF_OF_EXPORT",
        ]

        DC_CUSTOMS_HISTORY_STATUSES = [
            "SUBMITTED_TO_CUSTOMS",
            "QUERY_RAISED",
            "QUERY_FORWARDED",
            "QUERY_RESPONDED",
            "MAKER_RESPONDED",
            "LET_EXPORT",
            "SUBMITTED_TO_AC",
            "EGM_SUBMITTED",
            "SHIPMENT_SUCCESS",
            "PROOF_OF_EXPORT",
        ]

        # =================================================
        # UNIT APPROVER
        # =================================================

        if request.user.role == "UNIT_APPROVER":

            shipping_bills = (
                ShippingBill.objects.filter(
                    company=request.user.company,
                    status__in=UNIT_APPROVER_HISTORY_STATUSES,
                )
                .order_by("-created_at")
            )

        # =================================================
        # UNIT MAKER
        # =================================================

        elif request.user.role == "UNIT_MAKER":

            # DRAFT Shipping Bills belong in the Unit Maker's Inbox
            # (not yet submitted into the workflow). Every non-draft
            # SB created by this maker has entered the workflow and
            # belongs in the Submitted / In Progress section. Both
            # are returned here; the Inbox vs. Submitted/In Progress
            # split is done using the "status" field (DRAFT = Inbox,
            # anything else = Submitted / In Progress).
            shipping_bills = (
                ShippingBill.objects.filter(
                    created_by=request.user
                )
                .order_by("-created_at")
            )

        # =================================================
        # DC CUSTOMS
        # =================================================

        elif request.user.role == "DC_CUSTOMS":

            shipping_bills = (
                ShippingBill.objects.filter(
                    company__zone=request.user.zone,
                    status__in=DC_CUSTOMS_HISTORY_STATUSES,
                )
                .order_by("-created_at")
            )

        # =================================================
        # AC CUSTOMS
        # =================================================

        elif request.user.role == "AC_CUSTOMS":

            shipping_bills = (
                ShippingBill.objects.filter(
                    status="SUBMITTED_TO_AC"
                )
                .order_by("-created_at")
            )

        else:

            shipping_bills = (
                ShippingBill.objects.none()
            )

        serializer = ShippingBillSerializer(
            shipping_bills,
            many=True
        )

        return Response(
            serializer.data
        )

    # =====================================================
    # CREATE
    # =====================================================

    def post(self, request):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.company is None:

            return Response(
                {
                    "error": (
                        "Your user account is not linked "
                        "to a company."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ShippingBillSerializer(
            data=request.data
        )

        if serializer.is_valid():

            shipping_bill = serializer.save(
                created_by=request.user,
                company=request.user.company,
            )

            return Response(
                ShippingBillSerializer(
                    shipping_bill,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# SHIPPING BILL DETAIL
# =========================================================

class ShippingBillDetailView(APIView):

    def get_object(self, pk):

        return get_shipping_bill(pk)

    # =====================================================
    # GET
    # =====================================================

    def get(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = self.get_object(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ShippingBillSerializer(
            shipping_bill,
            context={"request": request},
        )

        return Response(
            serializer.data
        )

    # =====================================================
    # PUT
    # =====================================================

    def put(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = self.get_object(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # WORKFLOW LOCK AFTER LET EXPORT
        # -------------------------------------------------

        if shipping_bill.status in {
            "SUBMITTED_TO_AC",
            "EGM_SUBMITTED",
            "SHIPMENT_SUCCESS",
            "PROOF_OF_EXPORT",
        }:

            return Response(
                {
                    "error":
                    "This Shipping Bill is locked and cannot be edited after submission to AC Customs."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if shipping_bill.status == "LET_EXPORT":

            if request.user.role != "UNIT_APPROVER":

                return Response(
                    {
                        "error":
                        "Only Unit Approver can enter the final EGM Number and EGM Date after Let Export."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            allowed_egm_fields = {
                "egm_number",
                "egm_date",
            }

            unexpected_fields = set(request.data.keys()) - allowed_egm_fields

            if unexpected_fields:

                return Response(
                    {
                        "error":
                        "After Let Export, only EGM Number and EGM Date can be edited."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not str(request.data.get("egm_number") or "").strip():

                return Response(
                    {
                        "error": "EGM Number is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not request.data.get("egm_date"):

                return Response(
                    {
                        "error": "EGM Date is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = ShippingBillSerializer(
            shipping_bill,
            data=request.data
        )

        if serializer.is_valid():

            shipping_bill = serializer.save()

            return Response(
                ShippingBillSerializer(
                    shipping_bill
                ).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # =====================================================
    # DELETE
    # =====================================================

    def delete(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = self.get_object(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        shipping_bill.delete()

        return Response(
            {
                "message":
                "Shipping Bill deleted successfully"
            },
            status=status.HTTP_204_NO_CONTENT
        )


# =========================================================
# UNIT MAKER SUBMIT SHIPPING BILL
# =========================================================

class SubmitShippingBillView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.created_by != request.user:

            return Response(
                {
                    "error":
                    "You are not allowed to submit this Shipping Bill."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        allowed_submit_statuses = {
            "DRAFT",
            "SENT_BACK",
            "MAKER_RESPONDED",
        }

        if shipping_bill.status not in allowed_submit_statuses:

            return Response(
                {
                    "error":
                    "Only DRAFT, SENT_BACK, or MAKER_RESPONDED Shipping Bills can be submitted."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        shipping_bill.status = (
            "SUBMITTED_TO_APPROVER"
        )

        shipping_bill.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                "Shipping Bill submitted to Unit Approver successfully.",

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# UNIT APPROVER SHIPPING BILL ACTION
# =========================================================

class ApproverShippingBillActionView(APIView):

    def post(self, request, pk, action):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "UNIT_APPROVER":

            return Response(
                {
                    "error":
                    "Only Unit Approver can perform this action."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if (
            request.user.company
            and shipping_bill.company
            != request.user.company
        ):

            return Response(
                {
                    "error":
                    "You are not allowed to access this Shipping Bill."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # =================================================
        # INITIAL APPROVER STAGE
        # =================================================

        initial_approver_statuses = [
            "SUBMITTED_TO_APPROVER",
            "QUERY_RESPONDED",
            "MAKER_RESPONDED",
        ]

        # =================================================
        # LET EXPORT APPROVER STAGE
        # =================================================

        if shipping_bill.status == "LET_EXPORT":

            allowed_actions = [
                "submit-ac",
                "cancel",
            ]

        elif shipping_bill.status in initial_approver_statuses:

            allowed_actions = [
                "submit-customs",
                "send-back",
                "cancel",
            ]

        else:

            return Response(
                {
                    "error":
                    "This Shipping Bill is not waiting for Unit Approver."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if action not in allowed_actions:

            return Response(
                {
                    "error":
                    "This action is not allowed for the current Shipping Bill status."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =================================================
        # CANCEL
        # =================================================

        if action == "cancel":

            shipping_bill.status = (
                "CANCELLED"
            )

            message = (
                "Shipping Bill cancelled successfully."
            )

        # =================================================
        # SEND BACK TO MAKER
        # =================================================

        elif action == "send-back":

            shipping_bill.status = (
                "SENT_BACK"
            )

            message = (
                "Shipping Bill sent back to Unit Maker successfully."
            )

        # =================================================
        # SUBMIT TO DC CUSTOMS
        # =================================================

        elif action == "submit-customs":

            if not shipping_bill.shipping_bill_no:

                today = timezone.now()

                shipping_bill.shipping_bill_no = (
                    f"SB-{today.strftime('%Y%m%d')}-"
                    f"{shipping_bill.id:06d}"
                )

                shipping_bill.shipping_bill_date = (
                    today.date()
                )

            shipping_bill.status = (
                "SUBMITTED_TO_CUSTOMS"
            )

            message = (
                "Shipping Bill submitted to DC Customs successfully."
            )

        # =================================================
        # LET EXPORT → SUBMIT TO AC CUSTOMS
        # =================================================

        elif action == "submit-ac":

            if shipping_bill.status != "LET_EXPORT":

                return Response(
                    {
                        "error":
                        "Only LET EXPORT Shipping Bills can be submitted to AC Customs."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # -------------------------------------------------
            # EGM DETAILS ARE REQUIRED
            # Only Unit Approver can enter these values.
            # -------------------------------------------------

            if not str(shipping_bill.egm_number or "").strip():

                return Response(
                    {
                        "error":
                        "EGM Number is required before submitting to AC Customs."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not shipping_bill.egm_date:

                return Response(
                    {
                        "error":
                        "EGM Date is required before submitting to AC Customs."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # -------------------------------------------------
            # At least one uploaded document is required.
            # This matches the Let Export rule.
            # -------------------------------------------------

            if not shipping_bill.documents.exists():

                return Response(
                    {
                        "error":
                        "At least one Shipping Bill document is required before submitting to AC Customs."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # At least one document must exist.
            if not shipping_bill.documents.exists():
                return Response(
                    {
                        "error": "At least one Shipping Bill document must be uploaded before submitting to AC Customs."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Final EGM details must be saved before submitting to AC Customs.
            if not shipping_bill.egm_number or not shipping_bill.egm_date:
                return Response(
                    {
                        "error": "Final EGM Number and EGM Date must be entered and saved before submitting to AC Customs."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            shipping_bill.status = (
                "SUBMITTED_TO_AC"
            )

            shipping_bill.approver_submitted_to_ac_at = (
                timezone.now()
            )

            message = (
                "Shipping Bill submitted to AC Customs successfully."
            )

        else:

            return Response(
                {
                    "error":
                    "Invalid Approver action."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =================================================
        # SAVE
        # =================================================

        update_fields = [
            "status",
            "updated_at",
        ]

        if action == "submit-customs":

            update_fields.extend(
                [
                    "shipping_bill_no",
                    "shipping_bill_date",
                ]
            )

        if action == "submit-ac":

            update_fields.append(
                "approver_submitted_to_ac_at"
            )

        shipping_bill.save(
            update_fields=update_fields
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                message,

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# AC CUSTOMS SHIPMENT ACTION
# =========================================================

class ACShipmentActionView(APIView):

    def post(self, request, pk, action):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "AC_CUSTOMS":

            return Response(
                {
                    "error": "Only AC Customs can perform this action."
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

        if action != "shipment-success":

            return Response(
                {
                    "error": "Invalid AC Customs action."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if shipping_bill.status != "SUBMITTED_TO_AC":

            return Response(
                {
                    "error": "Only Shipping Bills submitted to AC Customs can be marked as Shipment Success."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        shipping_bill.status = "SHIPMENT_SUCCESS"
        shipping_bill.shipment_success_date = timezone.now().date()
        shipping_bill.ac_approved_at = timezone.now()

        shipping_bill.save(
            update_fields=[
                "status",
                "shipment_success_date",
                "ac_approved_at",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": "Shipment marked as successful.",
                "shipping_bill": ShippingBillSerializer(
                    shipping_bill
                ).data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# UNIT MAKER RESUBMIT
# =========================================================

class ResubmitShippingBillView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.created_by != request.user:

            return Response(
                {
                    "error":
                    "You are not allowed to resubmit this Shipping Bill."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if shipping_bill.status != "SENT_BACK":

            return Response(
                {
                    "error":
                    "Only SENT_BACK Shipping Bills can be resubmitted."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        shipping_bill.status = (
            "SUBMITTED_TO_APPROVER"
        )

        shipping_bill.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                "Shipping Bill resubmitted to Unit Approver successfully.",

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# DC CUSTOMS LET EXPORT
# =========================================================

class DCLetExportView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "DC_CUSTOMS":

            return Response(
                {
                    "error":
                    "Only DC Customs can grant Let Export."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.status != "SUBMITTED_TO_CUSTOMS":

            return Response(
                {
                    "error":
                    "This Shipping Bill is not waiting for Customs assessment."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =================================================
        # AT LEAST ONE SHIPPING BILL FILE IS REQUIRED
        # =================================================

        if not shipping_bill.documents.exists():

            return Response(
                {
                    "error":
                    "At least one Shipping Bill document must be uploaded before granting Let Export."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =================================================
        # GRANT LET EXPORT
        # =================================================

        shipping_bill.status = (
            "LET_EXPORT"
        )

        shipping_bill.let_export_date = (
            timezone.now().date()
        )

        shipping_bill.save(
            update_fields=[
                "status",
                "let_export_date",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                "Let Export granted successfully.",

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# DC CUSTOMS RAISE QUERY
# =========================================================

class DCRaiseQueryView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "DC_CUSTOMS":

            return Response(
                {
                    "error":
                    "Only DC Customs can raise a query."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.status != "SUBMITTED_TO_CUSTOMS":

            return Response(
                {
                    "error":
                    "This Shipping Bill is not waiting for Customs assessment."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        question = request.data.get(
            "question"
        )

        if not question or not question.strip():

            return Response(
                {
                    "error":
                    "Query question is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        query = ShippingBillQuery.objects.create(
            shipping_bill=shipping_bill,
            question=question.strip(),
            raised_by=request.user,
        )

        shipping_bill.status = (
            "QUERY_RAISED"
        )

        shipping_bill.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                "Query raised and forwarded to Unit Approver successfully.",

                "query_id":
                query.id,

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# UNIT APPROVER RESPONDS DIRECTLY TO QUERY
# =========================================================

class ApproverQueryResponseView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "UNIT_APPROVER":

            return Response(
                {
                    "error":
                    "Only Unit Approver can respond to the query."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.company != request.user.company:

            return Response(
                {
                    "error":
                    "You are not allowed to access this Shipping Bill."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if shipping_bill.status != "QUERY_RAISED":

            return Response(
                {
                    "error":
                    "This Shipping Bill does not have an open Customs query."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        response_text = request.data.get(
            "response"
        )

        if not response_text or not response_text.strip():

            return Response(
                {
                    "error":
                    "Query response is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        query = (
            shipping_bill.queries
            .filter(is_resolved=False)
            .order_by("-created_at")
            .first()
        )

        if not query:

            return Response(
                {
                    "error":
                    "No open Customs query found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        query.response = (
            response_text.strip()
        )

        query.responded_by = (
            request.user
        )

        query.responded_at = (
            timezone.now()
        )

        query.is_resolved = True

        query.save(
            update_fields=[
                "response",
                "responded_by",
                "responded_at",
                "is_resolved",
            ]
        )

        shipping_bill.status = (
            "QUERY_RESPONDED"
        )

        shipping_bill.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                "Query response submitted successfully.",

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# UNIT APPROVER RAISES A NEW QUERY TO MAKER
# =========================================================

class ApproverRaiseMakerQueryView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "UNIT_APPROVER":
            return Response(
                {"error": "Only Unit Approver can raise a query to Unit Maker."},
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:
            return Response(
                {"error": "Shipping Bill not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.company != request.user.company:
            return Response(
                {"error": "You are not allowed to access this Shipping Bill."},
                status=status.HTTP_403_FORBIDDEN
            )

        if shipping_bill.status != "SUBMITTED_TO_APPROVER":
            return Response(
                {"error": "A Unit Approver query can only be raised when the Shipping Bill is waiting for Approver review."},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = request.data.get("message", "")

        if not message or not message.strip():
            return Response(
                {"error": "Message to Unit Maker is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Keep the existing ShippingBillQuery model and history.
        # This is a new query raised directly by the Unit Approver,
        # rather than a forwarded DC Customs query.
        query = ShippingBillQuery.objects.create(
            shipping_bill=shipping_bill,
            question="Please correct the Shipping Bill as instructed by the Unit Approver.",
            approver_message=message.strip(),
            raised_by=request.user,
            forwarded_to_maker=True,
            is_resolved=False,
        )

        shipping_bill.status = "QUERY_FORWARDED"

        shipping_bill.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(shipping_bill)

        return Response(
            {
                "message": "Query raised and sent to Unit Maker successfully.",
                "query_id": query.id,
                "shipping_bill": serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# UNIT APPROVER FORWARDS QUERY TO MAKER
# =========================================================

class ApproverForwardQueryView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "UNIT_APPROVER":

            return Response(
                {
                    "error":
                    "Only Unit Approver can forward queries."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.company != request.user.company:

            return Response(
                {
                    "error":
                    "You are not allowed to access this Shipping Bill."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if shipping_bill.status != "QUERY_RAISED":

            return Response(
                {
                    "error":
                    "This Shipping Bill does not have an open Customs query."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        query = (
            shipping_bill.queries
            .filter(
                is_resolved=False,
                forwarded_to_maker=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not query:

            return Response(
                {
                    "error":
                    "No open Customs query found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        approver_message = request.data.get(
            "approver_message",
            ""
        )

        if (
            not approver_message
            or not approver_message.strip()
        ):

            return Response(
                {
                    "error":
                    "Message to Unit Maker is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        query.approver_message = (
            approver_message.strip()
        )

        query.forwarded_to_maker = True

        query.save(
            update_fields=[
                "approver_message",
                "forwarded_to_maker",
            ]
        )

        shipping_bill.status = (
            "QUERY_FORWARDED"
        )

        shipping_bill.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                "Customs query forwarded to Unit Maker.",

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# UNIT MAKER RESPONDS TO QUERY
# =========================================================

class MakerQueryResponseView(APIView):

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "UNIT_MAKER":

            return Response(
                {
                    "error":
                    "Only Unit Maker can respond to the query."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.created_by != request.user:

            return Response(
                {
                    "error":
                    "You are not allowed to respond to this Shipping Bill."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if shipping_bill.status != "QUERY_FORWARDED":

            return Response(
                {
                    "error":
                    "This Shipping Bill does not have a query waiting for your response."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        response_text = request.data.get(
            "response"
        )

        if not response_text or not response_text.strip():

            return Response(
                {
                    "error":
                    "Query response is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        query = (
            shipping_bill.queries
            .filter(
                forwarded_to_maker=True,
                is_resolved=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not query:

            return Response(
                {
                    "error":
                    "No open Customs query found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        query.response = (
            response_text.strip()
        )

        query.responded_by = (
            request.user
        )

        query.responded_at = (
            timezone.now()
        )

        # A Maker response completes the current query. The query record
        # remains in the database so the complete history is still visible,
        # but it must no longer be treated as an open query.
        query.is_resolved = True

        query.save(
            update_fields=[
                "response",
                "responded_by",
                "responded_at",
                "is_resolved",
            ]
        )

        shipping_bill.status = (
            "MAKER_RESPONDED"
        )

        shipping_bill.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ShippingBillSerializer(
            shipping_bill
        )

        return Response(
            {
                "message":
                "Query response submitted successfully.",

                "shipping_bill":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# SHIPPING BILL DOCUMENT LIST + UPLOAD
#
# Maker:
#   - upload invoice package
#   - upload BL document
#
# Approver:
#   - upload/replace documents when allowed
# =========================================================

class ShippingBillDocumentListCreateView(APIView):

    def get_shipping_bill_for_user(
        self,
        request,
        pk
    ):

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:
            return None, Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # UNIT MAKER
        # -------------------------------------------------

        if request.user.role == "UNIT_MAKER":

            if shipping_bill.created_by != request.user:

                return None, Response(
                    {
                        "error":
                        "You are not allowed to access this Shipping Bill."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -------------------------------------------------
        # UNIT APPROVER
        # -------------------------------------------------

        elif request.user.role == "UNIT_APPROVER":

            if (
                shipping_bill.company
                != request.user.company
            ):

                return None, Response(
                    {
                        "error":
                        "You are not allowed to access this Shipping Bill."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -------------------------------------------------
        # DC / AC
        # -------------------------------------------------

        elif request.user.role in [
            "DC_CUSTOMS",
            "AC_CUSTOMS",
        ]:

            pass

        else:

            return None, Response(
                {
                    "error":
                    "You are not allowed to access Shipping Bill documents."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        return shipping_bill, None

    # =====================================================
    # GET DOCUMENTS
    # =====================================================

    def get(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill, error_response = (
            self.get_shipping_bill_for_user(
                request,
                pk
            )
        )

        if error_response:
            return error_response

        documents = (
            ShippingBillDocument.objects.filter(
                shipping_bill=shipping_bill
            )
            .order_by("-uploaded_at")
        )

        serializer = ShippingBillDocumentSerializer(
            documents,
            many=True,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # =====================================================
    # POST DOCUMENT
    # =====================================================

    def post(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill, error_response = (
            self.get_shipping_bill_for_user(
                request,
                pk
            )
        )

        if error_response:
            return error_response

        if request.user.role not in [
            "UNIT_MAKER",
            "UNIT_APPROVER",
        ]:

            return Response(
                {
                    "error":
                    "Only Unit Maker or Unit Approver can upload documents."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        document_type = request.data.get(
            "document_type"
        )

        allowed_types = [
            "INVOICE_PACKAGE",
            "BL_DOCUMENT",
        ]

        if document_type not in allowed_types:

            return Response(
                {
                    "error":
                    "document_type must be INVOICE_PACKAGE or BL_DOCUMENT."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES.get(
            "file"
        )

        if not uploaded_file:

            return Response(
                {
                    "error":
                    "File is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Maximum file size = 10 MB
        # -------------------------------------------------

        max_size = 10 * 1024 * 1024

        if uploaded_file.size > max_size:

            return Response(
                {
                    "error":
                    "File size cannot exceed 10 MB."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Basic file extension check
        # -------------------------------------------------

        allowed_extensions = [
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png",
        ]

        filename = uploaded_file.name.lower()

        if not any(
            filename.endswith(extension)
            for extension in allowed_extensions
        ):

            return Response(
                {
                    "error":
                    "Only PDF, JPG, JPEG and PNG files are allowed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # One document of each type
        #
        # If already exists:
        # replace the file.
        # -------------------------------------------------

        document = (
            ShippingBillDocument.objects.filter(
                shipping_bill=shipping_bill,
                document_type=document_type,
            )
            .first()
        )

        if document:

            # Remove old verification because
            # a replaced document must be verified again.

            document.file = uploaded_file

            document.uploaded_by = request.user

            document.verified_by_approver = False

            document.verified_at = None

            document.verified_by = None

            document.save()

            message = (
                "Document replaced successfully. "
                "It must be verified again."
            )

            response_status = (
                status.HTTP_200_OK
            )

        else:

            document = (
                ShippingBillDocument.objects.create(
                    shipping_bill=shipping_bill,
                    document_type=document_type,
                    file=uploaded_file,
                    uploaded_by=request.user,
                )
            )

            message = (
                "Document uploaded successfully."
            )

            response_status = (
                status.HTTP_201_CREATED
            )

        serializer = ShippingBillDocumentSerializer(
            document,
            context={
                "request": request
            }
        )

        return Response(
            {
                "message":
                message,

                "document":
                serializer.data,
            },
            status=response_status
        )


# =========================================================
# SHIPPING BILL DOCUMENT DELETE
# =========================================================

class ShippingBillDocumentDeleteView(APIView):

    def delete(self, request, pk, document_id):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        document = (
            ShippingBillDocument.objects.filter(
                id=document_id,
                shipping_bill=shipping_bill,
            )
            .first()
        )

        if not document:

            return Response(
                {
                    "error":
                    "Document not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # UNIT MAKER
        # -------------------------------------------------

        if request.user.role == "UNIT_MAKER":

            if shipping_bill.created_by != request.user:

                return Response(
                    {
                        "error":
                        "You are not allowed to delete this document."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -------------------------------------------------
        # UNIT APPROVER
        # -------------------------------------------------

        elif request.user.role == "UNIT_APPROVER":

            if shipping_bill.company != request.user.company:

                return Response(
                    {
                        "error":
                        "You are not allowed to delete this document."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        else:

            return Response(
                {
                    "error":
                    "Only Unit Maker or Unit Approver can delete documents."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        document.delete()

        return Response(
            {
                "message":
                "Document deleted successfully."
            },
            status=status.HTTP_204_NO_CONTENT
        )


# =========================================================
# UNIT APPROVER DOCUMENT VERIFICATION
# =========================================================

class ShippingBillDocumentVerifyView(APIView):

    def post(self, request, pk, document_id):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error":
                    "Authentication required."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != "UNIT_APPROVER":

            return Response(
                {
                    "error":
                    "Only Unit Approver can verify documents."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        shipping_bill = get_shipping_bill(pk)

        if not shipping_bill:

            return Response(
                {
                    "error":
                    "Shipping Bill not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if shipping_bill.company != request.user.company:

            return Response(
                {
                    "error":
                    "You are not allowed to access this Shipping Bill."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        document = (
            ShippingBillDocument.objects.filter(
                id=document_id,
                shipping_bill=shipping_bill,
            )
            .first()
        )

        if not document:

            return Response(
                {
                    "error":
                    "Document not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -------------------------------------------------
        # Already verified
        # -------------------------------------------------

        if document.verified_by_approver:

            return Response(
                {
                    "message":
                    "Document is already verified.",

                    "document":
                    ShippingBillDocumentSerializer(
                        document,
                        context={
                            "request": request
                        }
                    ).data,
                },
                status=status.HTTP_200_OK
            )

        # -------------------------------------------------
        # VERIFY
        # -------------------------------------------------

        document.verified_by_approver = True

        document.verified_at = (
            timezone.now()
        )

        document.verified_by = (
            request.user
        )

        document.save(
            update_fields=[
                "verified_by_approver",
                "verified_at",
                "verified_by",
            ]
        )

        serializer = ShippingBillDocumentSerializer(
            document,
            context={
                "request": request
            }
        )

        return Response(
            {
                "message":
                "Document verified successfully.",

                "document":
                serializer.data,
            },
            status=status.HTTP_200_OK
        )