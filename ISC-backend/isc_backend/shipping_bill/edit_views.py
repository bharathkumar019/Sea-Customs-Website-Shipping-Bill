from django.db import transaction

from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .edit_serializers import EditableShippingBillSerializer
from .models import ShippingBill


# =========================================================
# STEP 2 — COMMON EDIT WORKFLOW
# =========================================================
# One edit API is used by both Unit Maker and Unit Approver.
# The serializer is the single source of truth for the fields
# that both roles are allowed to edit.
# =========================================================

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


def get_bill(pk):

    try:

        return (
            ShippingBill.objects
            .select_related(
                "company",
                "created_by",
            )
            .prefetch_related(
                "invoices__items",
                "items",
                "documents",
            )
            .get(pk=pk)
        )

    except ShippingBill.DoesNotExist:

        return None


def get_edit_permission(request, bill):
    """
    Return (allowed, error_message).

    Unit Maker:
        - must own the Shipping Bill
        - may edit only Maker-editable statuses

    Unit Approver:
        - must belong to the same company as the Shipping Bill
        - may edit the same common fields during Approver/query stages
    """

    role = getattr(request.user, "role", None)

    if role == "UNIT_MAKER":

        if bill.created_by_id != request.user.id:

            return (
                False,
                "You are not allowed to edit this Shipping Bill.",
            )

        if bill.status not in MAKER_EDITABLE_STATUSES:

            return (
                False,
                "This Shipping Bill cannot be edited by Unit Maker in its current status.",
            )

        return True, None

    if role == "UNIT_APPROVER":

        user_company_id = getattr(
            request.user,
            "company_id",
            None,
        )

        if not user_company_id or user_company_id != bill.company_id:

            return (
                False,
                "You are not allowed to access this Shipping Bill.",
            )

        if bill.status not in APPROVER_EDITABLE_STATUSES:

            return (
                False,
                "This Shipping Bill cannot be edited by Unit Approver in its current status.",
            )

        return True, None

    return (
        False,
        "Only Unit Maker or Unit Approver can edit this Shipping Bill.",
    )


class EditableShippingBillView(APIView):
    """
    Common Shipping Bill edit endpoint for Unit Maker and Unit Approver.

    GET  /shipping-bills/<id>/editable/
    PUT  /shipping-bills/<id>/editable/

    The response shape intentionally remains the same as the existing
    EditableShippingBillSerializer response so the current Maker UI does
    not need to be rewritten in Step 2.
    """

    parser_classes = [
        JSONParser,
    ]

    # =====================================================
    # GET
    # =====================================================

    def get(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        bill = get_bill(pk)

        if not bill:

            return Response(
                {
                    "error": "Shipping Bill not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        allowed, error_message = get_edit_permission(
            request,
            bill,
        )

        if not allowed:

            return Response(
                {
                    "error": error_message,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EditableShippingBillSerializer(
            bill,
            context={
                "request": request,
            },
        )

        return Response(serializer.data)

    # =====================================================
    # PUT
    # =====================================================

    @transaction.atomic
    def put(self, request, pk):

        if not request.user.is_authenticated:

            return Response(
                {
                    "error": "Authentication required.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        bill = get_bill(pk)

        if not bill:

            return Response(
                {
                    "error": "Shipping Bill not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        allowed, error_message = get_edit_permission(
            request,
            bill,
        )

        if not allowed:

            return Response(
                {
                    "error": error_message,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EditableShippingBillSerializer(
            bill,
            data=request.data,
            context={
                "request": request,
            },
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = serializer.save()

        updated = get_bill(updated.pk)

        return Response(
            EditableShippingBillSerializer(
                updated,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_200_OK,
        )
