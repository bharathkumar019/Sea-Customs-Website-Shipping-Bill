from django.contrib import admin

from .models import (
    ShippingBill,
    ShippingBillItem,
    ShippingBillQuery,
)


@admin.register(ShippingBill)
class ShippingBillAdmin(admin.ModelAdmin):

    list_display = (
        "request_id",
        "shipping_bill_no",
        "company",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "mode_of_transport",
    )

    search_fields = (
        "request_id",
        "shipping_bill_no",
        "exporter_name",
        "consignee_name",
        "invoice_number",
    )


@admin.register(ShippingBillItem)
class ShippingBillItemAdmin(admin.ModelAdmin):

    list_display = (
        "shipping_bill",
        "ritc_code",
        "unit_of_measurement",
        "quantity",
        "total_value",
    )

    search_fields = (
        "ritc_code",
        "description",
    )


@admin.register(ShippingBillQuery)
class ShippingBillQueryAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "shipping_bill",
        "forwarded_to_maker",
        "is_resolved",
        "created_at",
    )

    list_filter = (
        "forwarded_to_maker",
        "is_resolved",
    )