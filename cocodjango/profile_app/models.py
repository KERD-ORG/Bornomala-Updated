from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from simple_history.models import HistoricalRecords
from simple_history import register
from common.models import SoftDeleteModel
from common.models import TimestampedModel, State, Language
from common.models import ResearchInterestOptions, SkillOptions, UserDocument
from django_countries.fields import CountryField
from phonenumber_field.modelfields import PhoneNumberField
from common.models import TitleOptions
from educational_organizations_app.models import EducationalOrganizations
from college_app.models import College
from campus_app.models import Campus
from department_app.models import Department
from common.base_models import CustomGroup
import json


class UserDetails(SoftDeleteModel, TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    date_of_birth = models.DateField(null=True, blank=True)
    city_of_birth = models.CharField(max_length=100, null=True, blank=True)
    country_of_birth = models.CharField(max_length=100, null=True, blank=True)
    first_language = models.ForeignKey(Language, null=True, blank=True, on_delete=models.SET_NULL)
    other_languages = models.CharField(max_length=255, null=True, blank=True)
    military_status = models.JSONField(null=True, blank=True)
    parental_college_graduation_status = models.BooleanField(default=False)
    hispanic_latino_origin = models.BooleanField(null=True, blank=True)
    citizenship_status = models.JSONField(null=True, blank=True)
    country_of_citizenship = models.CharField(
        max_length=255, null=True, blank=True)
    dual_citizenship = models.BooleanField(default=False)
    legal_state_of_residence = models.CharField(
        max_length=100, null=True, blank=True)
    visa_status = models.CharField(max_length=255, null=True, blank=True)
    current_address_line1 = models.CharField(
        max_length=255, null=True, blank=True)
    current_address_line2 = models.CharField(
        max_length=255, null=True, blank=True)
    current_city = models.CharField(max_length=255,null=True, blank=False)
    current_state_province = models.ForeignKey(State, related_name='current_state', on_delete=models.SET_NULL, null=True)
    current_postal_code = models.CharField(
        max_length=20, null=True, blank=True)
    current_country = models.CharField(max_length=2,null=True, blank=False)
    permanent_address_status = models.BooleanField(default=False)
    permanent_address_line1 = models.CharField(
        max_length=255, null=True, blank=True)
    permanent_address_line2 = models.CharField(
        max_length=255, null=True, blank=True)
    permanent_city = models.CharField(max_length=255,null=True, blank=False)
    permanent_state_province = models.ForeignKey(State, related_name='permanent_state', on_delete=models.SET_NULL, null=True)
    permanent_postal_code = models.CharField(
        max_length=20, null=True, blank=True)
    permanent_country = models.CharField(max_length=2,null=True, blank=False)
    ethnicity = models.CharField(max_length=255, null=True, blank=True)
    ethnicity_details = models.CharField(max_length=255, null=True, blank=True)
    ethnicity_origin = models.BooleanField(default=False)
    ethnicity_reporting = models.BooleanField(default=False)
    currently_enrolled = models.BooleanField(default=False)
    emergency_fname = models.CharField(max_length=255, null=True, blank=True)
    emergency_lname = models.CharField(max_length=255, null=True, blank=True)
    emergency_address_line1 = models.CharField(
        max_length=255, null=True, blank=True)
    emergency_address_line2 = models.CharField(
        max_length=255, null=True, blank=True)
    emergency_city = models.TextField(null=True, blank=True)
    emergency_state = models.CharField(max_length=100, null=True, blank=True)
    emergency_postal_code = models.CharField(
        max_length=20, null=True, blank=True)
    emergency_country = models.CharField(max_length=100, null=True, blank=True)
    emergency_phone_number = models.CharField(
        max_length=100, null=True, blank=True)
    emergency_email = models.EmailField(max_length=255, null=True, blank=True)
    emergency_relation = models.CharField(
        max_length=100, null=True, blank=True)
    acknowledgement = models.BooleanField(default=False)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    campus = models.ForeignKey(Campus, null=True, blank=True, on_delete=models.SET_NULL)
    college = models.ForeignKey(College, null=True, blank=True, on_delete=models.SET_NULL)
    organization = models.ForeignKey(EducationalOrganizations, null=True, blank=True, on_delete=models.SET_NULL)
    
    user_type = models.CharField(max_length=255, null=True, blank=True)
    custom_groups = models.ManyToManyField(CustomGroup, blank=True, related_name='user_details')
    
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user.username} - User Details"


class Citizenship(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='citizenships', on_delete=models.CASCADE)
    state_province = models.ForeignKey(State, related_name='citizenship_state', on_delete=models.SET_NULL, null=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.country.name

    class Meta:
        verbose_name = 'Citizenship'
        verbose_name_plural = 'Citizenships'


class Visa(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(
        UserDetails, related_name='visas', on_delete=models.CASCADE)
    visa_type = models.CharField(max_length=100)
    state_province = models.ForeignKey(State, related_name='visa_state', on_delete=models.SET_NULL, null=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.visa_type} - {self.country_code}"


class ResearchInterest(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(
        UserDetails, related_name='research_interests', on_delete=models.CASCADE)
    research_interests_option = models.ForeignKey(
        ResearchInterestOptions, on_delete=models.CASCADE) 
    history = HistoricalRecords()

    def __str__(self):
        return f"Research Interest: {self.research_interests_option.topic} (User ID: {self.user_details.user_id})"

    class Meta:
        verbose_name = 'Research Interest'
        verbose_name_plural = 'Research Interests'
        

class EducationalBackground(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='academic_histories', on_delete=models.CASCADE)
    institution_name = models.CharField(max_length=255)
    institution_address = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    degree_expected = models.BooleanField(default=False)
    degree_date = models.DateField(null=True, blank=True)
    major = models.CharField(max_length=255)
    rank = models.PositiveIntegerField(default=0)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user.username} - {self.institution_name}"
    class Meta:
        ordering = ['rank']

class Dissertation(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='dissertations', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    academic_level = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    abstract = models.TextField()
    publications = models.TextField()
    full_dissertation_link = models.URLField(max_length=255)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user_details.user.username} - {self.title}"

class ResearchExperience(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='research_experiences', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    supervisor = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user_details.user.username} - {self.title}"

class Publication(SoftDeleteModel, TimestampedModel):
    JOURNAL = 'journal'
    WORKSHOP = 'workshop'
    CONFERENCE = 'conference'
    
    PUBLICATION_TYPE_CHOICES = [
        (JOURNAL, 'Journal'),
        (WORKSHOP, 'Workshop'),
        (CONFERENCE, 'Conference'),
    ]
    
    user_details = models.ForeignKey(UserDetails, related_name='publications', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    publication_type = models.CharField(max_length=20, choices=PUBLICATION_TYPE_CHOICES)
    authors = models.TextField()
    publication_date = models.DateField()
    abstract = models.TextField()
    name = models.CharField(max_length=255)
    doi_link = models.URLField(max_length=255)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user_details.user.username} - {self.title}"
    
class WorkExperience(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='work_experiences', on_delete=models.CASCADE)
    position_title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description_of_duties = models.TextField()
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user_details.user.username} - {self.position_title} at {self.company_name}"
    
class Skill(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='skills', on_delete=models.CASCADE)
    skill_option = models.ForeignKey(SkillOptions, on_delete=models.CASCADE)
    history = HistoricalRecords()

    def __str__(self):
        return f"Skill: {self.skill_option.skill_name} (User ID: {self.user_details.user_id})"

    class Meta:
        verbose_name = 'Skill'
        verbose_name_plural = 'Skills'
        
class TrainingWorkshop(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='training_workshops', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    organizer = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    start_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    certificate = models.TextField()
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user_details.user.username} - {self.name}"
    
class AwardGrantScholarship(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(
        UserDetails, related_name='awards_grants_scholarships', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    awarding_organization = models.CharField(max_length=255)
    date_received = models.DateField()
    description = models.TextField()
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user_details.user.username} - {self.name} by {self.awarding_organization}"
    
class VolunteerActivity(SoftDeleteModel, TimestampedModel):
    user_details = models.ForeignKey(UserDetails, related_name='volunteer_activities', on_delete=models.CASCADE)
    organization_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    role_description = models.TextField()
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user_details.user.username} - {self.organization_name} ({self.designation})"




class ReferenceInfo(SoftDeleteModel, TimestampedModel):
    TITLE_CHOICES =  TitleOptions.TITLE_OPTIONS
    user_details = models.ForeignKey(UserDetails, related_name='references', on_delete=models.CASCADE)
    title = models.CharField(max_length=50, choices=TITLE_CHOICES)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    organization_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    contact_number = PhoneNumberField()
    email_address = models.EmailField(max_length=100)
    relationship = models.CharField(max_length=100)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.title} {self.first_name} {self.last_name} ({self.organization_name})"

    class Meta:
        verbose_name = 'Reference'
        verbose_name_plural = 'References'

class TestScore(SoftDeleteModel, TimestampedModel):
    IELTS = 'IELTS'
    TOEFL = 'TOEFL'
    SAT = 'SAT'
    GRE = 'GRE'
    DUOLINGO = 'DUOLINGO'
    PTE = 'PTE'
    TEST_CHOICES = [
        (IELTS, 'IELTS'),
        (TOEFL, 'TOEFL'),
        (SAT, 'SAT'),
        (GRE, 'GRE'),
        (DUOLINGO, 'DUOLINGO'),
        (PTE, 'PTE'),
    ]

    user_details = models.ForeignKey(UserDetails, related_name='test_score', on_delete=models.CASCADE)
    test_name = models.CharField(max_length=100, choices=TEST_CHOICES)
    score = models.FloatField()  # Changed to FloatField
    date_taken = models.DateField()
    user_document = models.ForeignKey(UserDocument, null=True, blank=True, on_delete=models.SET_NULL)
    verified = models.BooleanField(default=False)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.test_name} - {self.score} (Verified: {self.verified})"
