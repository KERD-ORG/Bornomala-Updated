from django.db import models
from simple_history.models import HistoricalRecords
from simple_history import register
from common.models import SoftDeleteModel, TimestampedModel

class ContactUs(SoftDeleteModel, TimestampedModel):
    full_name = models.CharField(max_length=255, blank=False)
    email = models.EmailField(blank=False, null=True)
    message = models.TextField(blank=True, null=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.full_name}"


