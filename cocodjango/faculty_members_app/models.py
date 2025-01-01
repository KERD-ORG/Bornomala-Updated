from django.contrib.auth.models import User
from django.db import models
from simple_history.models import HistoricalRecords
from common.models import SoftDeleteModel, TimestampedModel,State


class FacultyMembers(SoftDeleteModel, TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    educational_organization = models.ForeignKey('educational_organizations_app.EducationalOrganizations', on_delete=models.CASCADE)
    department = models.ForeignKey('department_app.Department', on_delete=models.CASCADE, null=True, blank=True)
    campus = models.ForeignKey('campus_app.Campus', on_delete=models.CASCADE)
    college = models.ForeignKey('college_app.College', on_delete=models.CASCADE)
    personal_web_address = models.URLField(max_length=255, null=True, blank=True)
    research_profile_address = models.URLField(max_length=255, null=True, blank=True)
    orcid = models.IntegerField()
    faculty_type = models.CharField(max_length=100, null=True, blank=True)
   
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=False, blank=False,default='')
    state_province = models.ForeignKey(State,on_delete=models.SET_NULL,related_name= 'state_of_faculty', null=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country_code = models.CharField(max_length=2, null=True, blank=True)
    

    statement = models.TextField(null=True, blank=True)
    status = models.BooleanField()
    history = HistoricalRecords()

    class Meta:
        permissions = (
            ("view_any_facultymember", "Can view any faculty member"),
            ("view_own_facultymember", "Can view own faculty member"),
            ("change_any_facultymember", "Can change any faculty member"),
            ("change_own_facultymember", "Can change own faculty member"),
            ("delete_any_facultymember", "Can delete any faculty member"),
            ("delete_own_facultymember", "Can delete own faculty member"),
        )

    def __str__(self):
        return f"{self.user.get_full_name()} -, {self.campus.campus_name}"
