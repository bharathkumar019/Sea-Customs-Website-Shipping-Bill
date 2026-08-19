from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shipping_bill", "0005_alter_shippingbilldocument_options_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="shippingbilldocument",
            name="document_type",
            field=models.CharField(
                choices=[
                    ("INVOICE_PACKAGE", "Invoice Package"),
                    ("BL_DOCUMENT", "Bill of Lading Document"),
                    ("PL_DOCUMENT", "Packing List Document"),
                ],
                max_length=30,
            ),
        ),
        migrations.RemoveConstraint(
            model_name="shippingbilldocument",
            name="unique_shipping_bill_document_type",
        ),
    ]
