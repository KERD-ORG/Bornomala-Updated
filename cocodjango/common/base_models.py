# common/models.py
from django.contrib.auth.models import Permission
from django.contrib.auth.models import Group as DjangoGroup
from college_app.models import College
from educational_organizations_app.models import EducationalOrganizations
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords
from simple_history import register
from django.contrib.auth.models import User


class CustomGroup(models.Model):
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(
        EducationalOrganizations, on_delete=models.CASCADE, related_name='groups', null=True, blank=True)
    college = models.ForeignKey(
        College, on_delete=models.CASCADE, related_name='groups', null=True, blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)

    class Meta:
        # Ensures the combination is unique
        unique_together = ('name', 'organization', 'college')

    def __str__(self):
        org_name = self.organization.name if self.organization else "No Org"
        col_name = self.college.name if self.college else "No College"
        return f"{self.name} - {org_name} - {col_name}"

    def clean(self):
        if not self.organization and not self.college:
            raise ValidationError(
                'Either organization or college must be set.')

        if self.organization and self.college:
            raise ValidationError(
                'Either organization or college must be set not both.')

