from django.db import models
from common.models import Document, SoftDeleteModel, TimestampedModel
from simple_history.models import HistoricalRecords
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from rest_framework.validators import ValidationError
class Funding(SoftDeleteModel, TimestampedModel):
    EDU_ORG = 'EDU_ORG'
    COLLEGE = 'College'
    DEPARTMENT = 'Department'
    FACULTY = 'Faculty'
    OTHERS = 'Other'
    FUNDING_FOR_CHOICES = [
        (EDU_ORG, 'Educational Organization'),
        (COLLEGE, 'College'),
        (DEPARTMENT, 'Department'),
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
    INTERNATIONAL= 'International'
    NATIONAL ='National'
    FUNDING_OPPORTUNITY=[
        (INTERNATIONAL,'International'),
        (NATIONAL,'National')
    ]
    
    title_of_funding= models.CharField(max_length=255)
    number_of_positions_opening = models.IntegerField()
    funding_for = models.CharField(max_length=10, choices=FUNDING_FOR_CHOICES)
    funding_for_edu_org = models.ForeignKey(
        'educational_organizations_app.EducationalOrganizations',
        on_delete=models.SET_NULL,
        related_name='funding_for_edu_org',
        blank=True, null=True
    )
    funding_for_college = models.ForeignKey(
        'college_app.College',
        related_name='funding_for_college',
        on_delete=models.SET_NULL,
        blank=True, null=True
    )
    funding_for_dept = models.ForeignKey(
        'department_app.Department',
        related_name='funding_for_dept',
        on_delete=models.SET_NULL,
        blank=True, null=True
    )
    # funding_for_faculty_member = models.ForeignKey(
    #     'faculty_members_app.FacultyMembers',
    #     related_name='funding_for_faculty_member',
    #     on_delete=models.SET_NULL,
    #     blank=True, null=True
    # )
    funding_for_faculty_member = models.ForeignKey(User,  related_name='funding_for_faculty_member',blank=True, null=True, on_delete=models.CASCADE)
    funding_for_other_name = models.CharField(max_length=255, blank=True, null=True)
    
    funding_opportunity_for= models.CharField(max_length=13,choices=FUNDING_OPPORTUNITY)
    funding_type = models.CharField(max_length=12, choices=FUNDING_TYPE_CHOICES)
    funding_type_name = models.CharField(max_length=255, blank=True, null=True)

    amount_type = models.CharField(max_length=7, choices=AMOUNT_TYPE_CHOICES)
    amount_type_name = models.CharField(max_length=255, blank=True, null=True)

    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0.0)])

    benefits = models.ManyToManyField('Benefit', blank=True)

    web_address = models.URLField(max_length=255, null=True, blank=True)
    description = models.TextField()
    funding_open_date = models.DateField()
    funding_end_date = models.DateField()
    funding_doc= models.ForeignKey(Document,on_delete=models.CASCADE,null=True,blank=True)
    created_by = models.ForeignKey(User, related_name='funding_created_by', on_delete=models.SET_NULL, null=True, blank=True)
    updated_by = models.ForeignKey(User, related_name='funding_updated_by', on_delete=models.SET_NULL, null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"Funding for {self.get_funding_for_display()}"

    class Meta:
        permissions = [
            ('add_department_funding', 'Can add department funding'),
            ('add_college_funding', 'Can add college funding'),
            ('add_edu_org_funding', 'Can add educational organization funding'),
            ('add_faculty_funding', 'Can add faculty funding'),
            ('add_others_funding','Can Add others Funding'),
        ]

    def clean(self):
        super().clean()

        if self.funding_for == self.EDU_ORG:
            if self.funding_for_college or self.funding_for_dept or self.funding_for_faculty_member or self.funding_for_other_name:
                raise ValidationError('Educational Organization cannot be combined with other funding_for fields.')

        elif self.funding_for == self.COLLEGE:
            if self.funding_for_edu_org or self.funding_for_dept or self.funding_for_faculty_member or self.funding_for_other_name:
                raise ValidationError('College cannot be combined with other funding_for fields.')

        elif self.funding_for == self.DEPARTMENT:
            if self.funding_for_edu_org or self.funding_for_college or self.funding_for_faculty_member or self.funding_for_other_name:
                raise ValidationError('Department cannot be combined with other funding_for fields.')

        elif self.funding_for == self.FACULTY:
            if self.funding_for_edu_org or self.funding_for_college or self.funding_for_dept or self.funding_for_other_name:
                raise ValidationError('Faculty cannot be combined with other funding_for fields.')

        elif self.funding_for == self.OTHERS:
            if self.funding_for_edu_org or self.funding_for_college or self.funding_for_dept or self.funding_for_faculty_member:
                raise ValidationError('Other cannot be combined with other funding_for fields.')

        if self.funding_type != 'Other' and self.funding_type_name:
            raise ValidationError('Funding type name should be empty when funding type is not Other.')

        if self.amount_type != 'Other' and self.amount_type_name:
            raise ValidationError('Amount type name should be empty when amount type is not Other.')

class Benefit(SoftDeleteModel, TimestampedModel):
    name = models.CharField(max_length=255)
    details = models.TextField()
    history = HistoricalRecords()

    def __str__(self):
        return self.name


