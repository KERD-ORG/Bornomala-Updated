from django.db import models
from common.models import SoftDeleteModel, TimestampedModel,State
from simple_history.models import HistoricalRecords


class Campus(SoftDeleteModel, TimestampedModel):
    campus_name = models.CharField(max_length=255)
    educational_organization = models.ForeignKey('educational_organizations_app.EducationalOrganizations', on_delete=models.SET_NULL,related_name='edu_org_of_campus', null=True)
    
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=False, blank=False,default='')
    state_province = models.ForeignKey(State,on_delete=models.SET_NULL,related_name= 'state_of_campus', null=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    
    statement = models.TextField(null=True, blank=True)
    status = models.BooleanField(default=False)
    history = HistoricalRecords()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['campus_name', 'educational_organization', 'country_code', 'city', 'state_province'],
                name='unique_campus_details',
                condition=models.Q(deleted_at__isnull=True)
            )
        ]

    def __str__(self):
        return f"{self.campus_name} - {self.educational_organization} - {self.state_province if self.state_province else 'No Country'}"


