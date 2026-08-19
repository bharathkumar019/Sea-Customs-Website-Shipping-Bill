from django.db import models
from django.contrib.auth.models import AbstractUser
from company.models import Company
from company.models import Company, Zone, Region

class User(AbstractUser):

    ROLE_CHOICES = [
        ("UNIT_APPROVER", "Unit Approver"),
        ("UNIT_MAKER", "Unit Maker"),
        ("DC_CUSTOMS", "DC Customs"),
        ("AC_CUSTOMS", "AC Customs"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dc_customs_users"
    )

    region = models.ForeignKey(
        Region,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ac_customs_users"
    )

    full_name = models.CharField(max_length=150)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username