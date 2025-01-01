# models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from simple_history.models import HistoricalRecords
from simple_history import register
from common.models import SoftDeleteModel
from common.models import TimestampedModel


class PasswordResetToken(SoftDeleteModel, TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    expiry_time = models.DateTimeField()
    history = HistoricalRecords()

    def __str__(self):
        return f"Token for {self.user.username}"
    

class UserOTP(SoftDeleteModel, TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_secret = models.CharField(max_length=100, blank=True, null=True)
    verified = models.BooleanField(default=False) 
    history = HistoricalRecords()


    def __str__(self):
        return f"{self.user.username}'s OTP"
    

class ExtendedUser(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    middle_name = models.CharField(max_length=30, blank=True, null=True)
    history = HistoricalRecords()

    def __str__(self):
        return f'{self.user.username} ExtendedUser'
    

register(User)