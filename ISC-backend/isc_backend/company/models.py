from django.db import models

class Region(models.Model):

    REGION_CHOICES = [
        ("TN-N", "Tamil Nadu North"),
        ("TN-S", "Tamil Nadu South"),
        ("TN-E", "Tamil Nadu East"),
        ("TN-W", "Tamil Nadu West"),
    ]

    region_name = models.CharField(max_length=100)

    region_code = models.CharField(
        max_length=10,
        unique=True
    )

    def __str__(self):
        return self.region_name
    
class Zone(models.Model):

    zone_name = models.CharField(max_length=100)

    zone_code = models.CharField(
        max_length=10,
        unique=True
    )

    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name="zones",
        null=True,
        blank=True
    )

    def __str__(self):
        return self.zone_name


class Company(models.Model):

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    company_name = models.CharField(max_length=200)
    iec_code = models.CharField(max_length=20, unique=True)
    gstin = models.CharField(max_length=15, unique=True)

    zone = models.ForeignKey(
        Zone,
        on_delete=models.CASCADE,
        related_name="companies"
    )

    address = models.TextField()

    company_code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name