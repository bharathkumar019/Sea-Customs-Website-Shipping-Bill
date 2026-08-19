from django.contrib import admin
from .models import Region, Zone, Company


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "region_name",
        "region_code",
    )

    search_fields = (
        "region_name",
        "region_code",
    )

    ordering = ("id",)


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "zone_name",
        "zone_code",
        "region",
    )

    search_fields = (
        "zone_name",
        "zone_code",
    )

    ordering = ("id",)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):

    list_display = (
        "company_name",
        "company_code",
        "iec_code",
        "gstin",
        "zone",
        "status",
    )

    search_fields = (
        "company_name",
        "company_code",
        "iec_code",
        "gstin",
    )

    list_filter = (
        "status",
        "zone",
    )

    ordering = ("company_name",)