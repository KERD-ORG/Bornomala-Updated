from django.db import models
from simple_history.models import HistoricalRecords
from common.models import SoftDeleteModel, TimestampedModel
from django.contrib.auth.models import User
from django.utils.text import slugify
from common.models import Document


# Example Division model for Bangladesh
class Division(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=100, unique=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.name


class EducationalOrganizationsCategory(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.name


class EducationalOrganizations(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    under_category = models.ForeignKey(
        EducationalOrganizationsCategory,
        on_delete=models.SET_NULL,
        verbose_name="Category",
        null=True
    )
    web_address = models.URLField(max_length=255, null=True, blank=True)
    statement = models.TextField(null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True)
    status = models.BooleanField(default=False)

    # Address Fields
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    division = models.ForeignKey(
        Division,
        related_name='organization_division',
        on_delete=models.SET_NULL,
        null=True
    )
    district = models.CharField(max_length=255, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)

    # Contact Person Fields
    first_name = models.CharField(max_length=255, null=True, blank=True)
    middle_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    email = models.CharField(max_length=255, blank=True)

    # Audit Fields
    created_by = models.ForeignKey(
        User,
        related_name='educational_organizations_created',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    updated_by = models.ForeignKey(
        User,
        related_name='educational_organizations_updated',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # Remove the `country_code` field altogether for BD-only focus
    # country_code = models.CharField(max_length=2, null=True, blank=True)

    history = HistoricalRecords()

    class Meta:
        # Updated unique constraint – removed country_code
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'under_category', 'district'],
                name='unique_organization_details_bd',
                condition=models.Q(deleted_at__isnull=True)
            )
        ]

    def __str__(self):
        return self.name

    @property
    def slug(self):
        return slugify(self.name)

    @classmethod
    def get_by_slug(cls, slug):
        for org in cls.objects.all():
            if slugify(org.name) == slug:
                return org
        return None
