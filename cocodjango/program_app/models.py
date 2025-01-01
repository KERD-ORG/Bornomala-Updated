from django.db import models
from django.utils import timezone
from common.models import Document,SoftDeleteModel,TimestampedModel
from django.contrib.auth.models import User
from simple_history.models import HistoricalRecords


class Program(SoftDeleteModel, TimestampedModel):
    # Program Overview
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    department = models.ForeignKey('department_app.Department', on_delete=models.SET_NULL, null=True, blank=True)

    # Eligibility Criteria
    eligibility_criteria = models.TextField()

    # Required Documents (optional, related to Document model)
    required_documents = models.ManyToManyField(Document, blank=True,null=True)

    # Application Process
    application_process = models.TextField()
    application_start_date = models.DateField()
    application_end_date = models.DateField()
    application_fee = models.DecimalField(max_digits=10, decimal_places=2)

    # Entrance Exam Information (optional)
    entrance_exam_details = models.TextField(blank=True, null=True)
    exam_date = models.DateField(blank=True, null=True)

    # Interview Process (optional)
    interview_process = models.TextField(blank=True, null=True)

    # Financial Aid and Scholarships (optional)
    financial_aid_details = models.TextField(blank=True, null=True)

    # Contact Information
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    contact_office_location = models.CharField(max_length=255)
    status = models.BooleanField(default=False)

    created_by = models.ForeignKey(User, related_name='program_created_by', on_delete=models.SET_NULL, null=True, blank=True)
    updated_by = models.ForeignKey(User, related_name='program_updated_by', on_delete=models.SET_NULL, null=True, blank=True)
    
    # is_draft = models.BooleanField(default=False, editable=False)

    history = HistoricalRecords()
    def __str__(self):
        return self.title




# class ProgramDraft(models.Model):
#     user = models.OneToOneField(
#         User,
#         on_delete=models.CASCADE,
#         related_name='program_draft'
#     )

#     # Program Overview
#     title = models.CharField(max_length=255, blank=True, null=True)
#     description = models.TextField(blank=True, null=True)

#     # Eligibility Criteria
#     eligibility_criteria = models.TextField(blank=True, null=True)

#     # Required Documents (optional, related to Document model)
#     required_documents = models.ManyToManyField(Document, blank=True)

#     # Application Process
#     application_process = models.TextField(blank=True, null=True)
#     application_start_date = models.DateField(blank=True, null=True)
#     application_end_date = models.DateField(blank=True, null=True)
#     application_fee = models.DecimalField(
#         max_digits=10,
#         decimal_places=2,
#         blank=True,
#         null=True
#     )

#     # Entrance Exam Information (optional)
#     entrance_exam_details = models.TextField(blank=True, null=True)
#     exam_date = models.DateField(blank=True, null=True)

#     # Interview Process (optional)
#     interview_process = models.TextField(blank=True, null=True)

#     # Financial Aid and Scholarships (optional)
#     financial_aid_details = models.TextField(blank=True, null=True)

#     # Contact Information
#     contact_email = models.EmailField(blank=True, null=True)
#     contact_phone = models.CharField(max_length=20, blank=True, null=True)
#     contact_office_location = models.CharField(max_length=255, blank=True, null=True)

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     history = HistoricalRecords()

#     def __str__(self):
#         return f"Draft by {self.user.username}"