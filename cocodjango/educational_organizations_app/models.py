from django.db import models
from simple_history.models import HistoricalRecords
from common.models import SoftDeleteModel, TimestampedModel
from common.models import State
from django.contrib.auth.models import User
from common.models import Document
from django.utils.text import slugify

class EducationalOrganizationsCategory(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.name


class EducationalOrganizations(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    under_category = models.ForeignKey(EducationalOrganizationsCategory, on_delete=models.SET_NULL,verbose_name="Category", null=True)
    web_address = models.URLField(max_length=255, null=True, blank=True)
    statement = models.TextField(null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True)
    status = models.BooleanField(default=False)
    address_line1 = models.CharField(
        max_length=255, null=True, blank=True)
    address_line2 = models.CharField(
        max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255,null=True, blank=False)
    state_province = models.ForeignKey(State, related_name='organization_state', on_delete=models.SET_NULL, null=True)
    postal_code = models.CharField(
        max_length=20, null=True, blank=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    
    first_name = models.CharField(max_length=255, null=True, blank=True)
    middle_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    email = models.CharField(max_length=255, blank=True)
    
    created_by = models.ForeignKey(User, related_name='educational_organizations_created', on_delete=models.SET_NULL, null=True, blank=True)
    updated_by = models.ForeignKey(User, related_name='educational_organizations_updated', on_delete=models.SET_NULL, null=True, blank=True)
    history = HistoricalRecords()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name', 'under_category', 'country_code'],
                                    name='unique_organization_details',
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