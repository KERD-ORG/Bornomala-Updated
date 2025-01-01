from django.db import models
from simple_history.models import HistoricalRecords

from common.models import SoftDeleteModel, TimestampedModel,State

# Create your models here.

class Department(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    college = models.ForeignKey('college_app.College', on_delete=models.SET_NULL, null=True, blank=True)
    web_address = models.URLField(max_length=255, null=True,blank=True)
    
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=False, blank=False,default='')
    state_province = models.ForeignKey(State,on_delete=models.SET_NULL,related_name= 'state_of_department', null=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    
    statement = models.TextField(null=True, blank=True)
    status = models.BooleanField()
    degrees_offered = models.TextField(null=False, blank=False, default='', help_text='Comma-separated list of degrees offered')
    history = HistoricalRecords()
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'college'],
                name='unique_department_details',
                condition=models.Q(deleted_at__isnull=True)
            )
        ]
    def __str__(self):
        return f"{self.name} -{ self.college}"
    
    def get_degrees(self):
        """Returns the list of degrees as a list of strings"""
        return [degree.strip() for degree in self.degrees_offered.split(',') if degree]


class DegreeOptions:
    # Static choices for degrees
    DEGREE_CHOICES = [
        ('Associate Degree', 'Associate Degree'),
        ('Bachelor\'s Degree', 'Bachelor\'s Degree'),
        ('Master\'s Degree', 'Master\'s Degree'),
        ('Doctoral Degree', 'Doctoral Degree'),
        ('Professional Degree', 'Professional Degree'),
        ('Certificate', 'Certificate'),
        ('Diploma', 'Diploma'),
        ('Other', 'Other'),
    ]
    
    @staticmethod
    def get_degree_choices():
        return DegreeOptions.DEGREE_CHOICES