from django.db import models
from django.utils import timezone

class University(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    document = models.FileField(upload_to='university_documents/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        # Adding a custom permission along with the declear
        # fault ones
        permissions = [
            ("edit_view_university", "Can edit and view university"),
        ]

    def soft_delete(self):
        """Soft delete the university by setting the deleted_at timestamp."""
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        """String representation of the University model."""
        return self.name
