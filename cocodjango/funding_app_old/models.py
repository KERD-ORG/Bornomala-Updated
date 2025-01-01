from django.db import models
from common.models import SoftDeleteModel, TimestampedModel
from simple_history.models import HistoricalRecords
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User

class Funding(SoftDeleteModel, TimestampedModel):
    EDU_ORG = 'EDU_ORG'
    FACULTY = 'Faculty'
    OTHERS= 'Other'
    ORIGINATOR_CHOICES = [
        (EDU_ORG, 'Educational Organization'),
        (FACULTY, 'Faculty'),
        (OTHERS, 'Other'),
    ]
    TA = 'TA'
    RA = 'RA'
    FELLOW = 'Fellowship'
    SCHOLARSHIP = 'Scholarship'
    FUNDING_TYPE_CHOICES = [
        (TA, 'Teaching Assistantship'),
        (RA, 'Research Assistantship'),
        (FELLOW, 'Fellowship'),
        (SCHOLARSHIP, 'Scholarship'),
        (OTHERS, 'Other'),
    ]
    MONTHLY = 'Monthly'
    YEARLY = 'Yearly'
    AMOUNT_TYPE_CHOICES = [
        (MONTHLY, 'Monthly'),
        (YEARLY, 'Yearly'),
        (OTHERS, 'Other'),
    ]
    
    DEPARTMENT = 'Department'
    FUNDING_FOR_CHOICES = [
        (FACULTY, 'Faculty'),
        (DEPARTMENT, 'Department'),
        (OTHERS, 'Other'),
    ]

    originator = models.CharField(max_length=7, choices=ORIGINATOR_CHOICES)
    originator_edu_org = models.ForeignKey(
        'educational_organizations_app.EducationalOrganizations',
        on_delete=models.SET_NULL,
        related_name='originator_edu_org',
        blank=True, null=True
    )
    originator_faculty_member = models.ForeignKey(
        'faculty_members_app.FacultyMembers',
        related_name='originator_faculty_member',
        on_delete=models.SET_NULL,
        blank=True, null=True
    )
    originator_other_name = models.CharField(max_length=255, blank=True, null=True)

    funding_type = models.CharField(max_length=12, choices=FUNDING_TYPE_CHOICES)
    funding_type_name = models.CharField(max_length=255, blank=True, null=True)

    amount_type = models.CharField(max_length=7, choices=AMOUNT_TYPE_CHOICES)
    amount_type_name = models.CharField(max_length=255, blank=True, null=True)

    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.0)])

    benefits = models.ManyToManyField('Benefit', blank=True)

    funding_for = models.CharField(max_length=10, choices=FUNDING_FOR_CHOICES)
    funding_for_faculty = models.ForeignKey(
        'faculty_members_app.FacultyMembers',
        related_name='faculty_member',
        on_delete=models.SET_NULL,
        blank=True, null=True
    )
    funding_for_department = models.ForeignKey(
        'department_app.Department',
        related_name='department',
        on_delete=models.SET_NULL,
        blank=True, null=True
    )
    funding_for_other_name = models.CharField(max_length=255, blank=True, null=True)
    web_address = models.URLField(max_length=255, null=True, blank=True)
    funding_open_date = models.DateField()
    funding_end_date = models.DateField()
    created_by = models.ForeignKey(User, related_name='funding_created_by', on_delete=models.SET_NULL, null=True, blank=True)
    updated_by = models.ForeignKey(User, related_name='funding_updated_by', on_delete=models.SET_NULL, null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"Funding by {self.get_originator_display()}"

    def save(self, *args, **kwargs):
        if self.originator == self.EDU_ORG:
            self.originator_faculty_member = None
            self.originator_other_name = None
        elif self.originator == self.FACULTY:
            self.originator_edu_org = None
            self.originator_other_name = None
        elif self.originator == self.OTHERS:
            self.originator_edu_org = None
            self.originator_faculty_member = None

        if self.funding_type != 'Other':
            self.funding_type_name = None

        if self.amount_type != 'Other':
            self.amount_type_name = None

        if self.funding_for == self.FACULTY:
            self.funding_for_department = None
            self.funding_for_other_name = None
        elif self.funding_for == self.DEPARTMENT:
            self.funding_for_faculty = None
            self.funding_for_other_name = None
        elif self.funding_for == self.OTHERS:
            self.funding_for_faculty = None
            self.funding_for_department = None

        super().save(*args, **kwargs)

class Benefit(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    details = models.TextField()
    history = HistoricalRecords()

    def __str__(self):
        return self.name


