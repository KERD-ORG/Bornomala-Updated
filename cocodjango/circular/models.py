from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import post_save
from educational_organizations_app.models import EducationalOrganizations as Organization


class CircularCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)


class Circular(models.Model):
    title = models.CharField(max_length=200)
    category = models.ForeignKey(CircularCategory, on_delete=models.CASCADE, related_name='circulars')
    description = models.TextField()
    organization = models.ForeignKey(Organization,on_delete=models.SET_NULL,null=True,blank=True)
    publication_date = models.DateField()
    deadline = models.DateField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    eligibility_criteria = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=[('Open', 'Open'), ('Closed', 'Closed'), ('Upcoming', 'Upcoming')]
    )
    link_to_circular = models.URLField(blank=True)
    attachment = models.FileField(upload_to='attachments/', null=True, blank=True)
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the question was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the question was last updated."
    )

    def __str__(self):
        return self.title


# class Attachment(models.Model):
#     circular = models.ForeignKey(Circular, on_delete=models.CASCADE, related_name='attachments')
#     file_type = models.CharField(max_length=10)  # E.g., PDF, Image
#     file_name = models.CharField(max_length=200)
#     file_path = models.FileField(upload_to='attachments/')
#     uploaded_date = models.DateTimeField(auto_now_add=True)


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(CircularCategory, on_delete=models.CASCADE)
    subscribed_date = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    circular = models.ForeignKey(Circular, on_delete=models.CASCADE)
    notification_text = models.TextField()
    sent_date = models.DateTimeField(auto_now_add=True)
    read_status = models.BooleanField(default=False)


class Tag(models.Model):
    name = models.CharField(max_length=100)
    circular = models.ForeignKey(Circular, on_delete=models.CASCADE, related_name='tags')


class Analytics(models.Model):
    circular = models.ForeignKey(Circular, on_delete=models.CASCADE)
    views_count = models.PositiveIntegerField(default=0)
    applications_count = models.PositiveIntegerField(default=0)
    last_viewed = models.DateTimeField(null=True, blank=True)

@receiver(post_save, sender=Circular)
def create_analytics(sender, instance, created, **kwargs):
    if created:
        Analytics.objects.get_or_create(circular=instance)