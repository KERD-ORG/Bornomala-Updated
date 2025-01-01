# user_app/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from common.base_models import CustomGroup
from profile_app.models import UserDetails
from department_app.serializers import DepartmentSerializer
from college_app.serializers import CollegeSerializer
from campus_app.serializers import CampusSerializer
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from auth_app.serializers import UserSerializer
from auth_app.models import ExtendedUser
from educational_organizations_app.models import EducationalOrganizations
from department_app.models import Department

class CustomGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomGroup
        fields = ['id', 'name']
        
class ExtendedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtendedUser
        fields = ['middle_name']  # Add any other ExtendedUser fields you need

               
class UserDetailsSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    extended_user = ExtendedUserSerializer(source='user.extendeduser', read_only=True)
    groups = CustomGroupSerializer(source='user.groups', many=True, read_only=True)  # Fetch groups
    
    department = DepartmentSerializer()
    campus = serializers.SerializerMethodField()
    college = serializers.SerializerMethodField()
    organization = serializers.SerializerMethodField()
    faculty_dept_institute = serializers.SerializerMethodField()

    class Meta:
        model = UserDetails
        fields = [
            'id', 'user', 'extended_user', 'date_of_birth', 'city_of_birth', 'country_of_birth', 
            'first_language', 'other_languages', 'military_status', 'parental_college_graduation_status',
            'hispanic_latino_origin', 'citizenship_status', 'country_of_citizenship', 
            'dual_citizenship', 'legal_state_of_residence', 'visa_status', 
            'current_address_line1', 'current_address_line2', 'current_city', 
            'current_state_province', 'current_postal_code', 'current_country',
            'permanent_address_status', 'permanent_address_line1', 
            'permanent_address_line2', 'permanent_city', 'permanent_postal_code',
            'permanent_country', 'ethnicity', 'ethnicity_details', 
            'ethnicity_origin', 'ethnicity_reporting', 'currently_enrolled', 
            'emergency_fname', 'emergency_lname', 'emergency_address_line1', 
            'emergency_address_line2', 'emergency_city', 'emergency_state', 
            'emergency_postal_code', 'emergency_country', 'emergency_phone_number',
            'emergency_email', 'emergency_relation', 'acknowledgement', 
            'user_type','custom_groups',
            'created_at', 'updated_at',
            'department', 'campus', 'college', 'organization', 'groups', 'faculty_dept_institute'
        ]
        
    
    def get_faculty_dept_institute(self, obj):
        if obj:
            department_name = ''
            organization_name = ''
            
            # Retrieve department name by primary key if department exists
            if obj.department_id:
                department = Department.objects.filter(pk=obj.department_id).first()
                department_name = department.name if department else 'Unknown Department'
            
            # Retrieve organization name by primary key if organization exists
            if obj.organization_id:
                organization = EducationalOrganizations.objects.filter(pk=obj.organization_id).first()
                organization_name = organization.name if organization else 'Unknown Organization'
            
            # Format the result
            return f'{obj.user.first_name} {obj.user.last_name} ({obj.user.username}) - {department_name} - {organization_name}'
        
        return f'{obj.user.first_name} {obj.user.last_name} ({obj.user.username})'

        
    def get_department(self, obj):
        if obj.department:
            print(f"Department ID: {obj.department.id}, Name: {obj.department.name}")
            return {
                'id': obj.department.id,
                'name': obj.department.name
            }
        return None


    def get_campus(self, obj):
        if obj.campus:
            return {
                'id': obj.campus.id,
                'name': obj.campus.campus_name
            }
        return None

    def get_college(self, obj):
        if obj.college:
            return {
                'id': obj.college.id,
                'name': obj.college.name
            }
        return None

    def get_organization(self, obj):
        if obj.organization:
            return {
                'id': obj.organization.id,
                'name': obj.organization.name
            }
        return None

