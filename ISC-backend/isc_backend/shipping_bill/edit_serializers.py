from django.utils import timezone
from rest_framework import serializers

from .models import (
    ShippingBill,
    ShippingBillInvoice,
    ShippingBillItem,
)
from .serializers import get_hsn_data


EDITABLE_BILL_FIELDS = [
    "exporter_type",
    "exporter_name",
    "destination_country",
    "destination_company_name",
    "destination_address",
    "mode_of_transport",
    "port_of_loading",
    "port_of_discharge",
    "bl_number",
    "bl_date",
    "vessel_name",
    "voyage_number",
    "container_number",
    "seal_number",
]


# =========================================================
# ITEM
# =========================================================

class EditableItemSerializer(serializers.ModelSerializer):

    hsn_code = serializers.CharField(
        source="ritc_code"
    )

    class Meta:

        model = ShippingBillItem

        fields = [
            "hsn_code",
            "description",
            "unit_of_measurement",
            "quantity",
            "unit_price",
            "total_value",
        ]

    def validate(self, data):

        hsn_code = str(
            data.get("ritc_code") or ""
        ).strip()

        if not hsn_code:

            raise serializers.ValidationError({
                "hsn_code":
                    "HSN Code is required."
            })

        hsn = get_hsn_data(
            hsn_code
        )

        if not hsn:

            raise serializers.ValidationError({
                "hsn_code":
                    f"HSN code {hsn_code} was not found."
            })

        if not hsn["exportable"]:

            raise serializers.ValidationError({
                "hsn_code":
                    "This HSN is not exportable."
            })

        if hsn["restricted"]:

            raise serializers.ValidationError({
                "hsn_code":
                    "This HSN is restricted and cannot be exported."
            })

        if hsn["prohibited"]:

            raise serializers.ValidationError({
                "hsn_code":
                    "This HSN is prohibited for export."
            })

        quantity = data.get(
            "quantity"
        )

        unit_price = data.get(
            "unit_price"
        )

        if (
            quantity is None
            or quantity <= 0
        ):

            raise serializers.ValidationError({
                "quantity":
                    "Quantity must be greater than zero."
            })

        if (
            unit_price is None
            or unit_price < 0
        ):

            raise serializers.ValidationError({
                "unit_price":
                    "Unit Price cannot be negative."
            })

        # -------------------------------------------------
        # HSN search values are defaults only.
        # User can edit description/unit after search.
        # -------------------------------------------------

        if not str(
            data.get("description") or ""
        ).strip():

            data["description"] = (
                hsn["description"] or ""
            )

        if not str(
            data.get("unit_of_measurement") or ""
        ).strip():

            data["unit_of_measurement"] = (
                hsn["unit"] or ""
            )

        # -------------------------------------------------
        # TOTAL VALUE
        # -------------------------------------------------

        data["total_value"] = (
            quantity * unit_price
        )

        return data


# =========================================================
# INVOICE
# =========================================================

class EditableInvoiceSerializer(
    serializers.ModelSerializer
):

    items = EditableItemSerializer(
        many=True,
        required=False,
    )

    class Meta:

        model = ShippingBillInvoice

        fields = [
            "invoice_number",
            "invoice_date",
            "currency",
            "exchange_rate",
            "items",
        ]

    def validate_invoice_date(
        self,
        value
    ):

        if value > timezone.localdate():

            raise serializers.ValidationError(
                "Invoice Date cannot be a future date."
            )

        return value

    def validate(self, data):

        currency = str(
            data.get(
                "currency",
                "INR"
            ) or "INR"
        ).strip().upper()

        exchange_rate = data.get(
            "exchange_rate"
        )

        if currency == "INR":

            data["exchange_rate"] = None

        elif (
            exchange_rate is None
            or exchange_rate <= 0
        ):

            raise serializers.ValidationError({
                "exchange_rate":
                    "Exchange Rate is required for non-INR currency."
            })

        data["currency"] = currency

        return data


# =========================================================
# SHIPPING BILL
# =========================================================

class EditableShippingBillSerializer(
    serializers.ModelSerializer
):

    invoices = EditableInvoiceSerializer(
        many=True,
        required=False,
    )

    documents = serializers.SerializerMethodField()

    class Meta:

        model = ShippingBill

        fields = (
            EDITABLE_BILL_FIELDS
            + [
                "invoices",
                "documents",
            ]
        )

        read_only_fields = [
            "documents",
        ]

    # =====================================================
    # DOCUMENTS
    # =====================================================

    def get_documents(self, obj):

        request = self.context.get(
            "request"
        )

        result = []

        for document in (
            obj.documents.all()
            .order_by("document_type")
        ):

            if not document.file:
                continue

            try:
                url = document.file.url

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

            result.append({
                "id":
                    document.id,

                "document_type":
                    document.document_type,

                "file_url":
                    url,
            })

        return result

    # =====================================================
    # BL DATE
    # =====================================================

    def validate_bl_date(
        self,
        value
    ):

        if (
            value
            and value > timezone.localdate()
        ):

            raise serializers.ValidationError(
                "BL Date cannot be a future date."
            )

        return value

    # =====================================================
    # VALIDATION
    # =====================================================

    def validate(self, data):

        invoices = data.get(
            "invoices",
            []
        )

        seen = set()

        for invoice in invoices:

            number = str(
                invoice.get(
                    "invoice_number"
                ) or ""
            ).strip()

            if not number:

                raise serializers.ValidationError({
                    "invoices":
                        "Invoice Number is required."
                })

            key = number.lower()

            if key in seen:

                raise serializers.ValidationError({
                    "invoices":
                        f"Duplicate Invoice Number: {number}"
                })

            seen.add(key)

        return data

    # =====================================================
    # UPDATE
    # =====================================================

    def update(
        self,
        instance,
        validated_data
    ):

        invoices_data = (
            validated_data.pop(
                "invoices",
                None
            )
        )

        # -------------------------------------------------
        # UPDATE ONLY ALLOWED SHIPPING BILL FIELDS
        # -------------------------------------------------

        for field in EDITABLE_BILL_FIELDS:

            if field in validated_data:

                setattr(
                    instance,
                    field,
                    validated_data[field]
                )

        instance.save()

        # -------------------------------------------------
        # INVOICE + ITEM SNAPSHOT
        # -------------------------------------------------

        if invoices_data is not None:

            instance.invoices.all().delete()

            for invoice_data in invoices_data:

                items_data = (
                    invoice_data.pop(
                        "items",
                        []
                    )
                )

                invoice = (
                    ShippingBillInvoice.objects.create(
                        shipping_bill=instance,
                        **invoice_data
                    )
                )

                for item_data in items_data:

                    ShippingBillItem.objects.create(
                        shipping_bill=instance,
                        invoice=invoice,
                        **item_data
                    )

        return instance

    # =====================================================
    # LEGACY SINGLE INVOICE SUPPORT
    # =====================================================

    def to_representation(
        self,
        instance
    ):

        data = super().to_representation(
            instance
        )

        # If old records use legacy invoice fields,
        # convert them into the restricted invoice response.

        if not data.get("invoices"):

            legacy_items = (
                instance.items.filter(
                    invoice__isnull=True
                )
            )

            has_legacy_invoice = (
                bool(instance.invoice_number)
                or bool(instance.invoice_date)
                or bool(instance.currency)
                or instance.exchange_rate is not None
                or legacy_items.exists()
            )

            if has_legacy_invoice:

                data["invoices"] = [
                    {
                        "invoice_number":
                            instance.invoice_number or "",

                        "invoice_date":
                            instance.invoice_date,

                        "currency":
                            instance.currency or "INR",

                        "exchange_rate":
                            instance.exchange_rate,

                        "items":
                            EditableItemSerializer(
                                legacy_items,
                                many=True
                            ).data,
                    }
                ]

        return data