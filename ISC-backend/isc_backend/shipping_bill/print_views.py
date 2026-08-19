from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ShippingBill
from .serializers import ShippingBillSerializer


# =========================================================
# PRINT SB ACCESS
#
# This module is read-only.
# It does NOT change ShippingBill, status, workflow, or models.
# =========================================================

UNIT_APPROVER_PRINT_STATUSES = [
    "SUBMITTED_TO_APPROVER",
    "QUERY_RAISED",
    "QUERY_FORWARDED",
    "QUERY_RESPONDED",
    "MAKER_RESPONDED",
    "SENT_BACK",
    "CANCELLED",
    "SUBMITTED_TO_CUSTOMS",
    "LET_EXPORT",
    "SUBMITTED_TO_AC",
    "EGM_SUBMITTED",
    "SHIPMENT_SUCCESS",
    "PROOF_OF_EXPORT",
]

DC_CUSTOMS_PRINT_STATUSES = [
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

AC_CUSTOMS_PRINT_STATUSES = [
    "SUBMITTED_TO_AC",
    "EGM_SUBMITTED",
    "SHIPMENT_SUCCESS",
    "PROOF_OF_EXPORT",
]


def get_printable_shipping_bills(user):
    """
    Return exactly the Shipping Bills that the current role is
    allowed to see in its existing workflow.

    This is intentionally separate from the existing list view so
    the Print SB feature cannot change existing Inbox/Submitted logic.
    """

    if not user or not user.is_authenticated:
        return ShippingBill.objects.none()

    if user.role == "UNIT_MAKER":
        return (
            ShippingBill.objects
            .filter(created_by=user)
            .order_by("-created_at")
        )

    if user.role == "UNIT_APPROVER":
        return (
            ShippingBill.objects
            .filter(
                company=user.company,
                status__in=UNIT_APPROVER_PRINT_STATUSES,
            )
            .order_by("-created_at")
        )

    if user.role == "DC_CUSTOMS":
        return (
            ShippingBill.objects
            .filter(
                company__zone=user.zone,
                status__in=DC_CUSTOMS_PRINT_STATUSES,
            )
            .order_by("-created_at")
        )

    if user.role == "AC_CUSTOMS":
        return (
            ShippingBill.objects
            .filter(status__in=AC_CUSTOMS_PRINT_STATUSES)
            .order_by("-created_at")
        )

    return ShippingBill.objects.none()


class ShippingBillPrintListView(APIView):
    """
    GET /shipping-bills/print-list/

    Read-only list for the Print SB section.
    """

    def get(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        shipping_bills = get_printable_shipping_bills(request.user)

        serializer = ShippingBillSerializer(
            shipping_bills,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)


class ShippingBillPrintDetailView(APIView):
    """
    GET /shipping-bills/<id>/print/

    Read-only full Shipping Bill data for printing.

    The same role-based access check is performed again so a user
    cannot print another user's/company's SB by manually changing
    the URL.
    """

    def get(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        shipping_bill = (
            get_printable_shipping_bills(request.user)
            .filter(pk=pk)
            .first()
        )

        if not shipping_bill:
            return Response(
                {
                    "error": (
                        "You do not have permission to print "
                        "this Shipping Bill."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ShippingBillSerializer(
            shipping_bill,
            context={"request": request},
        )

        data = dict(serializer.data)

        # -----------------------------------------------------
        # PRINT-ONLY SIGNATURE MILESTONES
        #
        # No model fields are added.  The existing workflow status
        # and existing action timestamps are used only to decide
        # whether each signature block should be active.
        #
        # Maker: signature becomes active after the SB leaves DRAFT.
        # Approver: signature becomes active after SUBMIT TO DC CUSTOMS.
        # DC Customs: signature becomes active after LET EXPORT.
        # AC Customs: signature becomes active after SHIPMENT SUCCESS.
        # -----------------------------------------------------
        maker = getattr(shipping_bill, "created_by", None)

        maker_name = None
        if maker:
            maker_name = (
                getattr(maker, "get_full_name", lambda: "")()
                or getattr(maker, "username", None)
                or getattr(maker, "email", None)
            )

        # The existing model does not store a separate timestamp for
        # the Maker -> Approver or Approver -> DC action.  Therefore
        # the workflow status is used for the completion milestone.
        maker_done_statuses = {
            "SUBMITTED_TO_APPROVER",
            "SENT_BACK",
            "CANCELLED",
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
        }

        approver_done_statuses = {
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
        }

        dc_done_statuses = {
            "LET_EXPORT",
            "SUBMITTED_TO_AC",
            "EGM_SUBMITTED",
            "SHIPMENT_SUCCESS",
            "PROOF_OF_EXPORT",
        }

        ac_done_statuses = {
            "SHIPMENT_SUCCESS",
            "PROOF_OF_EXPORT",
        }

        maker_completed = shipping_bill.status in maker_done_statuses
        approver_completed = shipping_bill.status in approver_done_statuses
        dc_completed = shipping_bill.status in dc_done_statuses
        ac_completed = shipping_bill.status in ac_done_statuses

        data["print_signatures"] = {
            "unit_maker": {
                "completed": maker_completed,
                "name": maker_name if maker_completed else None,
                "date": shipping_bill.shipping_bill_date if maker_completed else None,
                "label": "Unit Maker",
                "action": "Submitted to Unit Approver",
            },
            "unit_approver": {
                "completed": approver_completed,
                "name": None,
                "date": shipping_bill.approver_submitted_to_ac_at if shipping_bill.approver_submitted_to_ac_at else None,
                "label": "Unit Approver",
                "action": "Submitted to DC Customs",
            },
            "dc_customs": {
                "completed": dc_completed,
                "name": None,
                "date": shipping_bill.let_export_date if shipping_bill.let_export_date else None,
                "label": "DC Customs",
                "action": "Let Export",
            },
            "ac_customs": {
                "completed": ac_completed,
                "name": None,
                "date": shipping_bill.shipment_success_date if shipping_bill.shipment_success_date else None,
                "label": "AC Customs",
                "action": "Shipment Success",
            },
        }

        return Response(data)
