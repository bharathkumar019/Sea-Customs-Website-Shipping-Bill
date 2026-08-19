import uuid

from django.db import models
from django.utils import timezone

from authentication.models import User
from company.models import Company


# =========================================================
# SHIPPING BILL
# =========================================================

class ShippingBill(models.Model):

    STATUS_CHOICES = [

        # Unit Maker
        ("DRAFT", "Draft"),
        ("SUBMITTED_TO_APPROVER", "Submitted to Unit Approver"),

        # Unit Maker / Approver
        ("SENT_BACK", "Sent Back to Unit Maker"),
        ("CANCELLED", "Cancelled"),

        # DC Customs
        ("SUBMITTED_TO_CUSTOMS", "Submitted to DC Customs"),
        ("QUERY_RAISED", "Query Raised"),
        ("QUERY_FORWARDED", "Query Forwarded to Unit Maker"),
        ("QUERY_RESPONDED", "Query Responded"),
        ("MAKER_RESPONDED", "Maker Responded"),

        # DC Customs → Unit Approver
        ("LET_EXPORT", "Let Export"),

        # Unit Approver → AC Customs
        ("SUBMITTED_TO_AC", "Submitted to AC Customs"),

        # AC Customs
        ("EGM_SUBMITTED", "EGM Submitted"),
        ("SHIPMENT_SUCCESS", "Shipment Success"),

        # Proof of Export
        ("PROOF_OF_EXPORT", "Proof of Export"),
    ]

    # =====================================================
    # IDENTIFICATION
    # =====================================================

    request_id = models.CharField(
        max_length=40,
        unique=True,
        blank=True,
    )

    shipping_bill_no = models.CharField(
        max_length=40,
        unique=True,
        blank=True,
        null=True,
    )

    shipping_bill_date = models.DateField(
        blank=True,
        null=True,
    )

    # =====================================================
    # OWNERSHIP
    # =====================================================

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="shipping_bills",
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_shipping_bills",
    )

    # =====================================================
    # GENERAL DETAILS
    # =====================================================

    exporter_type = models.CharField(
        max_length=100,
        blank=True,
    )

    exporter_name = models.CharField(
        max_length=200,
        blank=True,
    )

    consignee_name = models.CharField(
        max_length=200,
        blank=True,
    )

    customs_house_code = models.CharField(
        max_length=20,
        blank=True,
    )

    # These were already present in your project
    destination_country = models.CharField(
        max_length=100,
        blank=True,
    )

    destination_company_name = models.CharField(
        max_length=200,
        blank=True,
    )

    destination_address = models.TextField(
        blank=True,
    )

    # =====================================================
    # SHIPPING DETAILS
    # =====================================================

    mode_of_transport = models.CharField(
        max_length=30,
        default="SEA",
    )

    port_of_loading = models.CharField(
        max_length=150,
        blank=True,
    )

    port_of_discharge = models.CharField(
        max_length=150,
        blank=True,
    )

    # =====================================================
    # BILL OF LADING
    # =====================================================

    bl_number = models.CharField(
        max_length=100,
        blank=True,
    )

    bl_date = models.DateField(
        blank=True,
        null=True,
    )

    vessel_name = models.CharField(
        max_length=150,
        blank=True,
    )

    voyage_number = models.CharField(
        max_length=100,
        blank=True,
    )

    container_number = models.CharField(
        max_length=100,
        blank=True,
    )

    seal_number = models.CharField(
        max_length=100,
        blank=True,
    )

    # =====================================================
    # OLD / LEGACY SINGLE INVOICE DETAILS
    #
    # Kept because your existing database/frontend already
    # uses these fields.
    #
    # New multiple invoice functionality uses
    # ShippingBillInvoice below.
    # =====================================================

    invoice_number = models.CharField(
        max_length=50,
        blank=True,
    )

    invoice_date = models.DateField(
        blank=True,
        null=True,
    )

    buyer_name = models.CharField(
        max_length=200,
        blank=True,
    )

    currency = models.CharField(
        max_length=10,
        blank=True,
    )

    exchange_rate = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        default=1,
    )

    freight = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    insurance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    other_charges = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    total_invoice_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    # =====================================================
    # CUSTOMS / ASSESSMENT
    # =====================================================

    customs_assessment_remarks = models.TextField(
        blank=True,
    )

    let_export_date = models.DateField(
        blank=True,
        null=True,
    )

    # =====================================================
    # POST LET EXPORT DOCUMENT
    #
    # Existing functionality — keep it.
    # Later we will also support ShippingBillDocument.
    # =====================================================

    post_let_document = models.FileField(
        upload_to="shipping_bill_post_let/",
        blank=True,
        null=True,
    )

    post_let_document_number = models.CharField(
        max_length=100,
        blank=True,
    )

    # =====================================================
    # APPROVER / AC TIMESTAMPS
    # =====================================================

    approver_submitted_to_ac_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    ac_approved_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    # =====================================================
    # EGM DETAILS
    # =====================================================

    egm_number = models.CharField(
        max_length=100,
        blank=True,
    )

    egm_date = models.DateField(
        blank=True,
        null=True,
    )

    shipment_success_date = models.DateField(
        blank=True,
        null=True,
    )

    # =====================================================
    # PROOF OF EXPORT
    # =====================================================

    proof_of_export_number = models.CharField(
        max_length=100,
        blank=True,
    )

    proof_of_export_date = models.DateField(
        blank=True,
        null=True,
    )

    # =====================================================
    # PHYSICAL DOCUMENT FLAGS
    # =====================================================

    physical_copies_received = models.BooleanField(
        default=False,
    )

    supporting_documents_received = models.BooleanField(
        default=False,
    )

    # =====================================================
    # STATUS
    # =====================================================

    status = models.CharField(
        max_length=40,
        choices=STATUS_CHOICES,
        default="DRAFT",
    )

    # =====================================================
    # TIMESTAMPS
    # =====================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    # =====================================================
    # SAVE
    # =====================================================

    def save(self, *args, **kwargs):

        if not self.request_id:

            today = timezone.now().strftime("%Y%m%d")

            unique_part = uuid.uuid4().hex[:8].upper()

            self.request_id = (
                f"SBREQ-{today}-{unique_part}"
            )

        super().save(*args, **kwargs)

    # =====================================================
    # STRING
    # =====================================================

    def __str__(self):

        return (
            self.shipping_bill_no
            or self.request_id
        )


# =========================================================
# MULTIPLE INVOICE
# =========================================================

class ShippingBillInvoice(models.Model):

    shipping_bill = models.ForeignKey(
        ShippingBill,
        on_delete=models.CASCADE,
        related_name="invoices",
    )

    invoice_number = models.CharField(
        max_length=50,
    )

    invoice_date = models.DateField()

    currency = models.CharField(
        max_length=10,
        default="INR",
    )

    exchange_rate = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
    )

    freight = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    insurance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    other_charges = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    total_invoice_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "shipping_bill",
                    "invoice_number",
                ],
                name="unique_invoice_number_per_shipping_bill",
            )
        ]

    def __str__(self):

        return self.invoice_number


# =========================================================
# SHIPPING BILL ITEM
# =========================================================

class ShippingBillItem(models.Model):

    # Keep nullable because your existing database contains
    # old rows where shipping_bill_id is NULL.
    shipping_bill = models.ForeignKey(
        ShippingBill,
        on_delete=models.CASCADE,
        related_name="items",
        null=True,
        blank=True,
    )

    # Multiple invoice support
    invoice = models.ForeignKey(
        ShippingBillInvoice,
        on_delete=models.CASCADE,
        related_name="items",
        null=True,
        blank=True,
    )

    # =====================================================
    # HSN / ITEM DETAILS
    # =====================================================

    ritc_code = models.CharField(
        max_length=20,
    )

    description = models.CharField(
        max_length=500,
    )

    unit_of_measurement = models.CharField(
        max_length=30,
    )

    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=3,
    )

    unit_price = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        default=0,
    )

    total_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    # =====================================================
    # HSN TAX RATES
    #
    # HSN values come from your MySQL HSN table.
    # These fields store the calculated values for the SB item.
    # =====================================================

    export_duty_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=5,
    )

    gst_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=15,
    )

    igst_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=4,
    )

    other_duty_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=2,
    )

    calculated_igst = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    calculated_other_duty = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )

    total_tax_duty_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
    )

    risk_category = models.CharField(
        max_length=20,
        blank=True,
    )

    # =====================================================
    # TIMESTAMP
    # =====================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):

        return (
            f"{self.ritc_code} - "
            f"{self.unit_of_measurement}"
        )


# =========================================================
# SHIPPING BILL DOCUMENT
# =========================================================

class ShippingBillDocument(models.Model):

    DOCUMENT_TYPE_CHOICES = [
        (
            "INVOICE_PACKAGE",
            "Invoice Package",
        ),
        (
            "BL_DOCUMENT",
            "Bill of Lading Document",
        ),
        (
            "PL_DOCUMENT",
            "Packing List Document",
        ),
    ]

    shipping_bill = models.ForeignKey(
        ShippingBill,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    document_type = models.CharField(
        max_length=30,
        choices=DOCUMENT_TYPE_CHOICES,
    )

    file = models.FileField(
        upload_to="",
    )

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_shipping_bill_documents",
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    verified_by_approver = models.BooleanField(
        default=False,
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_shipping_bill_documents",
    )

    class Meta:
        # Multiple Invoice / PL / BL documents are allowed
        # for the same Shipping Bill.
        constraints = []

    def __str__(self):

        return (
            f"{self.shipping_bill.request_id} - "
            f"{self.document_type}"
        )


# =========================================================
# SHIPPING BILL QUERY
# =========================================================

class ShippingBillQuery(models.Model):

    shipping_bill = models.ForeignKey(
        ShippingBill,
        on_delete=models.CASCADE,
        related_name="queries",
    )

    question = models.TextField()

    approver_message = models.TextField(
        blank=True,
        null=True,
    )

    response = models.TextField(
        blank=True,
    )

    raised_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="shipping_queries_raised",
    )

    responded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shipping_queries_answered",
    )

    forwarded_to_maker = models.BooleanField(
        default=False,
    )

    is_resolved = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    responded_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    def __str__(self):

        return (
            f"Query #{self.id} - "
            f"{self.shipping_bill.request_id}"
        )