from django.db import models
from simple_history.models import HistoricalRecords
from common.models import SoftDeleteModel, TimestampedModel,State


class College(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    campus = models.ForeignKey('campus_app.Campus', on_delete=models.SET_NULL,related_name='college_of_campus', null=True)
    web_address = models.URLField(max_length=255, null=True, blank=True)
    
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=False, blank=False,default='')
    state_province = models.ForeignKey(State,on_delete=models.SET_NULL,related_name= 'state_of_college', null=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    
    statement = models.TextField(null=True, blank=True)
    status = models.BooleanField()
    history = HistoricalRecords()


    def __str__(self):
        return f"{self.name} at {self.campus}"
