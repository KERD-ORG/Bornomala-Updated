# Generated by Django 5.0.3 on 2024-08-15 10:45

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Funding",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("university", models.CharField(max_length=200)),
                ("department", models.CharField(max_length=201)),
                ("professor", models.CharField(max_length=100)),
                ("minimum_cgpa", models.FloatField()),
                ("required_ielts_score", models.FloatField()),
                ("funding_document_path", models.TextField()),
            ],
        ),
    ]
