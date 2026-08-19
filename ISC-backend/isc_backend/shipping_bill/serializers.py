from decimal import Decimal, InvalidOperation

from django.db import connection
from django.utils import timezone

from rest_framework import serializers

from .models import (
    ShippingBill,
    ShippingBillItem,
    ShippingBillQuery,
    ShippingBillDocument,
    ShippingBillInvoice,
)


# =========================================================
# FIXED TAX RATES
# =========================================================

EXPORT_DUTY_RATE = Decimal("5.00")
GST_RATE = Decimal("15.00")


# =========================================================
# HSN LOOKUP HELPER
# =========================================================

def get_hsn_data(hsn_code):
    """
    Read HSN information directly from the existing
    MySQL hsn_master table.

    No Django HSN model is used.
    """

    hsn_code = str(hsn_code or "").strip()

    if not hsn_code:
        return None

    query = """
        SELECT
            hsn_code,
            description,
            product_category,
            unit,
            exportable,
            export_declaration,
            restricted,
            prohibited,
            hazardous,
            igst_rate,
            other_duty_rate,
            risk_category
        FROM hsn_master
        WHERE hsn_code = %s
        LIMIT 1
    """

    with connection.cursor() as cursor:
        cursor.execute(query, [hsn_code])
        row = cursor.fetchone()

    if not row:
        return None

    (
        db_hsn_code,
        description,
        product_category,
        unit,
        exportable,
        export_declaration,
        restricted,
        prohibited,
        hazardous,
        igst_rate,
        other_duty_rate,
        risk_category,
    ) = row

    try:
        igst_rate = Decimal(str(igst_rate or "0"))
        other_duty_rate = Decimal(str(other_duty_rate or "0"))

    except (
        InvalidOperation,
        ValueError,
        TypeError,
    ):
        raise serializers.ValidationError(
            {
                "hsn_code":
                    "Invalid tax rate configured for this HSN code."
            }
        )

    # -----------------------------------------------------
    # Base rate
    # Export Duty = 5%
    # GST        = 15%
    #
    # HSN IGST / Other Duty are percentages of 20%
    # -----------------------------------------------------

    base_rate = EXPORT_DUTY_RATE + GST_RATE

    calculated_igst = (
        base_rate * igst_rate / Decimal("100")
    )

    calculated_other_duty = (
        base_rate * other_duty_rate / Decimal("100")
    )

    total_tax_duty = (
        EXPORT_DUTY_RATE
        + GST_RATE
        + calculated_igst
        + calculated_other_duty
    )

    return {
        "hsn_code": db_hsn_code,
        "description": description or "",
        "product_category": product_category or "",
        "unit": unit or "",

        "exportable": bool(exportable),

        "export_declaration": bool(
            export_declaration
        ),

        "restricted": bool(restricted),
        "prohibited": bool(prohibited),
        "hazardous": bool(hazardous),

        "igst_rate": igst_rate,
        "other_duty_rate": other_duty_rate,

        "calculated_igst": calculated_igst,

        "calculated_other_duty": (
            calculated_other_duty
        ),

        "total_tax_duty": total_tax_duty,

        "risk_category": (
            risk_category or ""
        ),
    }


# =========================================================
# DOCUMENT SERIALIZER
# =========================================================

class ShippingBillDocumentSerializer(
    serializers.ModelSerializer
):

    document_type_display = serializers.CharField(
        source="get_document_type_display",
        read_only=True,
    )

    file_url = serializers.SerializerMethodField()

    class Meta:

        model = ShippingBillDocument

        fields = [
            "id",
            "shipping_bill",
            "document_type",
            "document_type_display",
            "file",
            "file_url",
            "uploaded_by",
            "uploaded_at",
            "verified_by_approver",
            "verified_at",
            "verified_by",
        ]

        read_only_fields = [
            "id",
            "shipping_bill",
            "uploaded_by",
            "uploaded_at",
            "verified_by_approver",
            "verified_at",
            "verified_by",
            "file_url",
        ]

    def validate_document_type(self, value):

        allowed_types = {
            "INVOICE_PACKAGE",
            "PL_DOCUMENT",
            "BL_DOCUMENT",
        }

        if value not in allowed_types:
            raise serializers.ValidationError(
                "Invalid document type."
            )

        return value

    def validate_file(self, value):

        if not value:
            raise serializers.ValidationError(
                "Document file is required."
            )

        # 10 MB maximum
        max_size = 10 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "File size cannot exceed 10 MB."
            )

        return value

    def get_file_url(self, obj):

        if not obj.file:
            return None

        request = self.context.get("request")

        try:
            url = obj.file.url
        except ValueError:
            return None

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

        if request:
            return request.build_absolute_uri(url)

        return url


# =========================================================
# ITEM SERIALIZER
# =========================================================

class ShippingBillItemSerializer(
    serializers.ModelSerializer
):

    # Frontend uses hsn_code.
    # Database uses ritc_code.

    hsn_code = serializers.CharField(
        source="ritc_code"
    )

    # -----------------------------------------------------
    # HSN INFORMATION
    # -----------------------------------------------------

    product_category = (
        serializers.SerializerMethodField()
    )

    exportable = (
        serializers.SerializerMethodField()
    )

    export_declaration = (
        serializers.SerializerMethodField()
    )

    restricted = (
        serializers.SerializerMethodField()
    )

    prohibited = (
        serializers.SerializerMethodField()
    )

    hazardous = (
        serializers.SerializerMethodField()
    )

    # -----------------------------------------------------
    # TAX VALUES
    # -----------------------------------------------------

    export_duty_rate = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        read_only=True,
    )

    gst_rate = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        read_only=True,
    )

    igst_rate = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        read_only=True,
    )

    other_duty_rate = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        read_only=True,
    )

    calculated_igst = serializers.DecimalField(
        max_digits=8,
        decimal_places=4,
        read_only=True,
    )

    calculated_other_duty = serializers.DecimalField(
        max_digits=8,
        decimal_places=4,
        read_only=True,
    )

    total_tax_duty_rate = serializers.DecimalField(
        max_digits=8,
        decimal_places=4,
        read_only=True,
    )

    risk_category = serializers.CharField(
        read_only=True
    )

    class Meta:

        model = ShippingBillItem

        fields = [

            "id",

            "invoice",

            "shipping_bill",

            "hsn_code",

            "description",

            "unit_of_measurement",

            "quantity",

            "unit_price",

            "total_value",

            # HSN

            "product_category",

            "exportable",

            "export_declaration",

            "restricted",

            "prohibited",

            "hazardous",

            # Tax

            "export_duty_rate",

            "gst_rate",

            "igst_rate",

            "other_duty_rate",

            "calculated_igst",

            "calculated_other_duty",

            "total_tax_duty_rate",

            "risk_category",

            "created_at",
        ]

        read_only_fields = [

            "id",

            "invoice",

            "shipping_bill",

            "total_value",

            "export_duty_rate",

            "gst_rate",

            "igst_rate",

            "other_duty_rate",

            "calculated_igst",

            "calculated_other_duty",

            "total_tax_duty_rate",

            "product_category",

            "exportable",

            "export_declaration",

            "restricted",

            "prohibited",

            "hazardous",

            "risk_category",

            "created_at",
        ]

    # =====================================================
    # VALIDATION
    # =====================================================

    def validate(self, data):

        hsn_code = data.get("ritc_code")

        if not hsn_code:
            raise serializers.ValidationError(
                {
                    "hsn_code":
                        "HSN code is required."
                }
            )

        hsn_data = get_hsn_data(hsn_code)

        if not hsn_data:
            raise serializers.ValidationError(
                {
                    "hsn_code":
                        f"HSN code {hsn_code} was not found."
                }
            )

        # -------------------------------------------------
        # EXPORTABILITY
        # -------------------------------------------------

        if not hsn_data["exportable"]:
            raise serializers.ValidationError(
                {
                    "hsn_code":
                        "This HSN is not exportable."
                }
            )

        # -------------------------------------------------
        # RESTRICTED
        # -------------------------------------------------

        if hsn_data["restricted"]:
            raise serializers.ValidationError(
                {
                    "hsn_code":
                        "This HSN is restricted and "
                        "cannot be exported through "
                        "this Shipping Bill."
                }
            )

        # -------------------------------------------------
        # PROHIBITED
        # -------------------------------------------------

        if hsn_data["prohibited"]:
            raise serializers.ValidationError(
                {
                    "hsn_code":
                        "This HSN is prohibited for export."
                }
            )

        # -------------------------------------------------
        # HSN AUTO-FILL
        # -------------------------------------------------

        data["description"] = (
            hsn_data["description"]
        )

        data["unit_of_measurement"] = (
            hsn_data["unit"]
        )

        # -------------------------------------------------
        # TAX SNAPSHOT
        # -------------------------------------------------

        data["export_duty_rate"] = (
            EXPORT_DUTY_RATE
        )

        data["gst_rate"] = (
            GST_RATE
        )

        data["igst_rate"] = (
            hsn_data["igst_rate"]
        )

        data["other_duty_rate"] = (
            hsn_data["other_duty_rate"]
        )

        data["calculated_igst"] = (
            hsn_data["calculated_igst"]
        )

        data["calculated_other_duty"] = (
            hsn_data["calculated_other_duty"]
        )

        data["total_tax_duty_rate"] = (
            hsn_data["total_tax_duty"]
        )

        data["risk_category"] = (
            hsn_data["risk_category"]
        )

        # -------------------------------------------------
        # QUANTITY / PRICE
        # -------------------------------------------------

        quantity = data.get("quantity")

        unit_price = data.get("unit_price")

        if quantity is None:
            raise serializers.ValidationError(
                {
                    "quantity":
                        "Quantity is required."
                }
            )

        if quantity <= 0:
            raise serializers.ValidationError(
                {
                    "quantity":
                        "Quantity must be greater than zero."
                }
            )

        if unit_price is None:
            raise serializers.ValidationError(
                {
                    "unit_price":
                        "Unit price is required."
                }
            )

        if unit_price < 0:
            raise serializers.ValidationError(
                {
                    "unit_price":
                        "Unit price cannot be negative."
                }
            )

        data["total_value"] = (
            quantity * unit_price
        )

        return data

    # =====================================================
    # REPRESENTATION
    # =====================================================

    def get_product_category(self, obj):

        data = get_hsn_data(
            obj.ritc_code
        )

        if not data:
            return ""

        return data["product_category"]

    def get_exportable(self, obj):

        data = get_hsn_data(
            obj.ritc_code
        )

        if not data:
            return None

        return data["exportable"]

    def get_export_declaration(self, obj):

        data = get_hsn_data(
            obj.ritc_code
        )

        if not data:
            return None

        return data["export_declaration"]

    def get_restricted(self, obj):

        data = get_hsn_data(
            obj.ritc_code
        )

        if not data:
            return None

        return data["restricted"]

    def get_prohibited(self, obj):

        data = get_hsn_data(
            obj.ritc_code
        )

        if not data:
            return None

        return data["prohibited"]

    def get_hazardous(self, obj):

        data = get_hsn_data(
            obj.ritc_code
        )

        if not data:
            return None

        return data["hazardous"]


# =========================================================
# INVOICE SERIALIZER
# =========================================================

class ShippingBillInvoiceSerializer(
    serializers.ModelSerializer
):

    items = ShippingBillItemSerializer(
        many=True,
        required=False,
    )

    class Meta:

        model = ShippingBillInvoice

        fields = [

            "id",

            "shipping_bill",

            "invoice_number",

            "invoice_date",

            "currency",

            "exchange_rate",

            "freight",

            "insurance",

            "other_charges",

            "total_invoice_value",

            "items",

            "created_at",

            "updated_at",
        ]

        read_only_fields = [

            "id",

            "shipping_bill",

            "created_at",

            "updated_at",

        ]

    # =====================================================
    # VALIDATION
    # =====================================================

    def validate_invoice_date(self, value):

        if value > timezone.localdate():

            raise serializers.ValidationError(
                "Invoice date cannot be a future date."
            )

        return value

    def validate(self, data):

        currency = (
            data.get(
                "currency",
                "INR"
            )
            or "INR"
        ).upper().strip()

        exchange_rate = data.get(
            "exchange_rate"
        )

        if currency == "INR":

            data["exchange_rate"] = None

        else:

            if (
                exchange_rate is None
                or exchange_rate <= 0
            ):

                raise serializers.ValidationError(
                    {
                        "exchange_rate":
                            "Exchange rate is required "
                            "for non-INR currency."
                    }
                )

        data["currency"] = currency

        return data


# =========================================================
# QUERY SERIALIZER
# =========================================================

class ShippingBillQuerySerializer(
    serializers.ModelSerializer
):

    raised_by_role = serializers.SerializerMethodField()

    def get_raised_by_role(self, obj):
        return getattr(obj.raised_by, "role", None)

    class Meta:

        model = ShippingBillQuery

        fields = [

            "id",

            "shipping_bill",

            "question",

            "approver_message",

            "response",

            "raised_by",

            "raised_by_role",

            "responded_by",

            "forwarded_to_maker",

            "is_resolved",

            "created_at",

            "responded_at",
        ]

        read_only_fields = [

            "id",

            "shipping_bill",

            "raised_by",

            "raised_by_role",

            "responded_by",

            "created_at",

            "responded_at",
        ]


# =========================================================
# SHIPPING BILL SERIALIZER
# =========================================================

class ShippingBillSerializer(
    serializers.ModelSerializer
):

    # =====================================================
    # NESTED INVOICES
    # =====================================================

    invoices = ShippingBillInvoiceSerializer(
        many=True,
        required=False,
    )

    # =====================================================
    # LEGACY ITEMS
    # =====================================================

    items = ShippingBillItemSerializer(
        many=True,
        required=False,
    )

    # =====================================================
    # QUERIES
    # =====================================================

    queries = ShippingBillQuerySerializer(
        many=True,
        read_only=True,
    )

    # =====================================================
    # DOCUMENTS
    # =====================================================

    documents = ShippingBillDocumentSerializer(
        many=True,
        read_only=True,
    )

    # =====================================================
    # COMPANY INFORMATION
    # =====================================================

    exporter_company_name = (
        serializers.SerializerMethodField()
    )

    exporter_company_address = (
        serializers.SerializerMethodField()
    )

    exporter_iec = (
        serializers.SerializerMethodField()
    )

    exporter_gstin = (
        serializers.SerializerMethodField()
    )

    class Meta:

        model = ShippingBill

        fields = [

            # -------------------------------------------------
            # IDENTIFICATION
            # -------------------------------------------------

            "id",

            "request_id",

            "shipping_bill_no",

            "shipping_bill_date",

            # -------------------------------------------------
            # OWNERSHIP
            # -------------------------------------------------

            "company",

            "created_by",

            # -------------------------------------------------
            # GENERAL DETAILS
            # -------------------------------------------------

            "exporter_type",

            "exporter_name",

            "exporter_company_name",

            "exporter_company_address",

            "exporter_iec",

            "exporter_gstin",

            "consignee_name",

            "destination_country",

            "destination_company_name",

            "destination_address",

            "customs_house_code",

            # -------------------------------------------------
            # SHIPMENT DETAILS
            # -------------------------------------------------

            "mode_of_transport",

            "port_of_loading",

            "port_of_discharge",

            # -------------------------------------------------
            # BILL OF LADING
            # -------------------------------------------------

            "bl_number",

            "bl_date",

            "vessel_name",

            "voyage_number",

            "container_number",

            "seal_number",

            # -------------------------------------------------
            # OLD SINGLE INVOICE
            # -------------------------------------------------

            "invoice_number",

            "invoice_date",

            "buyer_name",

            "currency",

            "exchange_rate",

            "freight",

            "insurance",

            "other_charges",

            "total_invoice_value",

            # -------------------------------------------------
            # MULTIPLE INVOICES
            # -------------------------------------------------

            "invoices",

            # -------------------------------------------------
            # CUSTOMS
            # -------------------------------------------------

            "customs_assessment_remarks",

            "let_export_date",

            # -------------------------------------------------
            # EGM
            # -------------------------------------------------

            "egm_number",

            "egm_date",

            "shipment_success_date",

            # -------------------------------------------------
            # PROOF OF EXPORT
            # -------------------------------------------------

            "proof_of_export_number",

            "proof_of_export_date",

            # -------------------------------------------------
            # PHYSICAL DOCUMENTS
            # -------------------------------------------------

            "physical_copies_received",

            "supporting_documents_received",

            # -------------------------------------------------
            # POST LET EXPORT
            # -------------------------------------------------

            "post_let_document",

            "post_let_document_number",

            "approver_submitted_to_ac_at",

            "ac_approved_at",

            # -------------------------------------------------
            # STATUS
            # -------------------------------------------------

            "status",

            # -------------------------------------------------
            # ITEMS
            # -------------------------------------------------

            "items",

            # -------------------------------------------------
            # DOCUMENTS
            # -------------------------------------------------

            "documents",

            # -------------------------------------------------
            # QUERIES
            # -------------------------------------------------

            "queries",

            # -------------------------------------------------
            # TIMESTAMPS
            # -------------------------------------------------

            "created_at",

            "updated_at",
        ]

        read_only_fields = [

            "id",

            "request_id",

            "shipping_bill_no",

            "shipping_bill_date",

            "company",

            "created_by",

            "status",

            "queries",

            "documents",

            "created_at",

            "updated_at",

            "proof_of_export_number",

            "proof_of_export_date",

            "exporter_company_name",

            "exporter_company_address",

            "exporter_iec",

            "exporter_gstin",
        ]

    # =====================================================
    # COMPANY DETAILS
    # =====================================================

    def _get_display_company(self, obj):
        """
        Prefer the authenticated user's company for the read-only
        company information shown in the Shipping Bill screen.
        Fall back to the Shipping Bill's company when no request/user
        context is available (for example, background serialization).
        """
        request = self.context.get("request")

        if request is not None:
            user = getattr(request, "user", None)

            if user is not None and user.is_authenticated:
                user_company = getattr(user, "company", None)

                if user_company is not None:
                    return user_company

        return getattr(obj, "company", None)

    def get_exporter_company_name(self, obj):
        company = self._get_display_company(obj)

        return getattr(
            company,
            "company_name",
            ""
        ) or ""

    def get_exporter_company_address(self, obj):
        company = self._get_display_company(obj)

        return getattr(
            company,
            "address",
            ""
        ) or ""

    def get_exporter_iec(self, obj):
        company = self._get_display_company(obj)

        return getattr(
            company,
            "iec_code",
            ""
        ) or ""

    def get_exporter_gstin(self, obj):
        company = self._get_display_company(obj)

        return getattr(
            company,
            "gstin",
            ""
        ) or ""

    # =====================================================
    # DATE VALIDATION
    # =====================================================

    def validate_bl_date(self, value):

        if (
            value
            and value > timezone.localdate()
        ):

            raise serializers.ValidationError(
                "BL date cannot be a future date."
            )

        return value

    # =====================================================
    # CREATE
    # =====================================================

    def create(self, validated_data):

        invoices_data = (
            validated_data.pop(
                "invoices",
                []
            )
        )

        legacy_items_data = (
            validated_data.pop(
                "items",
                []
            )
        )

        shipping_bill = (
            ShippingBill.objects.create(
                **validated_data
            )
        )

        # -------------------------------------------------
        # CREATE INVOICES
        # -------------------------------------------------

        for invoice_data in invoices_data:

            items_data = (
                invoice_data.pop(
                    "items",
                    []
                )
            )

            invoice = (
                ShippingBillInvoice.objects.create(
                    shipping_bill=shipping_bill,
                    **invoice_data
                )
            )

            for item_data in items_data:

                ShippingBillItem.objects.create(
                    invoice=invoice,
                    shipping_bill=shipping_bill,
                    **item_data
                )

        # -------------------------------------------------
        # CREATE LEGACY ITEMS
        # -------------------------------------------------

        for item_data in legacy_items_data:

            ShippingBillItem.objects.create(
                shipping_bill=shipping_bill,
                **item_data
            )

        return shipping_bill

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

        legacy_items_data = (
            validated_data.pop(
                "items",
                None
            )
        )

        # -------------------------------------------------
        # UPDATE SHIPPING BILL
        # -------------------------------------------------

        for attr, value in (
            validated_data.items()
        ):

            setattr(
                instance,
                attr,
                value
            )

        instance.save()

        # -------------------------------------------------
        # UPDATE INVOICES
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
                        invoice=invoice,
                        shipping_bill=instance,
                        **item_data
                    )

        # -------------------------------------------------
        # UPDATE LEGACY ITEMS
        # -------------------------------------------------

        if legacy_items_data is not None:

            instance.items.filter(
                invoice__isnull=True
            ).delete()

            for item_data in legacy_items_data:

                ShippingBillItem.objects.create(
                    shipping_bill=instance,
                    **item_data
                )

        return instance