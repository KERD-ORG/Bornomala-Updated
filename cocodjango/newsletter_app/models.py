from django.db import models

from common.models import SoftDeleteModel, TimestampedModel


# Create your models here.

class NewsletterSubscription(SoftDeleteModel, TimestampedModel):
    email = models.EmailField(unique=True)
