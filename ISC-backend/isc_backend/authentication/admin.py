from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "username",
        "full_name",
        "role",
        "company",
        "zone",
        "region",
        "status",
        "is_active",
    )

    list_filter = (
        "role",
        "status",
        "is_active",
        "zone",
        "region",
    )

    search_fields = (
        "username",
        "full_name",
        "email",
    )

    ordering = (
        "username",
    )

    # ADD THIS
    fieldsets = UserAdmin.fieldsets + (
        (
            "Custom Information",
            {
                "fields": (
                    "full_name",
                    "role",
                    "company",
                    "zone",
                    "region",
                    "status",
                ),
            },
        ),
    )

    # ADD THIS
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Custom Information",
            {
                "fields": (
                    "full_name",
                    "role",
                    "company",
                    "zone",
                    "region",
                    "status",
                ),
            },
        ),
    )