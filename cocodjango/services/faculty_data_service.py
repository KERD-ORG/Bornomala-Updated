from django.forms.models import model_to_dict
from django.shortcuts import get_object_or_404
from educational_organizations_app.models import EducationalOrganizations
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from campus_app.models import Campus
from campus_app.serializers import CampusSerializer
from college_app.models import College
from college_app.serializers import CollegeSerializer
from department_app.models import Department
from department_app.serializers import DepartmentSerializer
from faculty_members_app.models import FacultyMembers
from faculty_members_app.serializers import  FacultyMembersSerializer
 
class FacultyDataService:
    def __init__(self, faculty_member):
        self.faculty_member = faculty_member
        try:
            self.faculty_member_details = get_object_or_404(FacultyMembers, user=faculty_member)
            faculty_data_main = {
                'username': faculty_member.username,
                'first_name': faculty_member.first_name,
                'last_name': faculty_member.last_name,
                'email': faculty_member.email,
                'date_joined': faculty_member.date_joined
            }
            self.faculty_data = faculty_data_main
        except Exception as e:
            self.faculty_member_details = None
            self.faculty_data = None
    
    def get_educational_organizations(self):
        if not self.faculty_member_details:
            return []
        educational_organization = EducationalOrganizations.objects.filter(id=self.faculty_member_details.educational_organization.id)
        serializer = EducationalOrganizationsSerializer(educational_organization, many=True)
        return serializer.data

    def get_campuses(self):
        if not self.faculty_member_details:
            return []
        campuses = Campus.objects.filter(id=self.faculty_member_details.campus.id)
        serializer = CampusSerializer(campuses, many=True)
        return serializer.data

    def get_colleges(self):
        if not self.faculty_member_details:
            return []
        colleges = College.objects.filter(id=self.faculty_member_details.college.id)
        serializer = CollegeSerializer(colleges, many=True)
        return serializer.data

    def get_departments(self):
        if not self.faculty_member_details:
            return []
        departments = Department.objects.filter(id=self.faculty_member_details.department.id)
        serializer = DepartmentSerializer(departments, many=True)
        return serializer.data

    def get_faculty_member_details(self):
        if not self.faculty_member_details:
            return []
        serializer = FacultyMembersSerializer(self.faculty_member_details)
        return serializer.data

    def get_faculty_data(self):
        if not self.faculty_member_details:
            return {
                'faculty_main':  [],
                'faculty_details': [],
                'educational_organizations': [],
                'campuses': [],
                'colleges': [],
                'departments': []
            }
        return {
            'faculty_main': self.faculty_data,
            'faculty_details': model_to_dict(self.faculty_member_details),
            'educational_organizations': self.get_educational_organizations(),
            'campuses': self.get_campuses(),
            'colleges': self.get_colleges(),
            'departments': self.get_departments()
        }

    def flatten_data(self, data_list, prefix):
        flat_data = {}
        if not isinstance(data_list, list):
            print("Expected a list but got:", type(data_list))
            return flat_data

        for i, item in enumerate(data_list):
            if isinstance(item, dict):
                for k, v in item.items():
                    flat_data[f"{prefix}{i}_{k}"] = v
            else:
                print(f"Item {i} is not a dictionary: {item} (type: {type(item)})")
                flat_data[f"{prefix}{i}_value"] = str(item)

        return flat_data

    def get_flat_faculty_data(self):
        faculty_data = self.get_faculty_data()
        flat_data = {
            **self.flatten_data(faculty_data['educational_organizations'], 'educational_organization_'),
            **self.flatten_data(faculty_data['campuses'], 'campus_'),
            **self.flatten_data(faculty_data['colleges'], 'college_'),
            **self.flatten_data(faculty_data['departments'], 'department_')
        }
        return flat_data

    @staticmethod
    def get_all_flat_faculty_data():
        all_faculty_members = FacultyMembers.objects.all()
        all_faculty_data = []
        for faculty_member in all_faculty_members:
            faculty_data_service = FacultyDataService(faculty_member.user)
            all_faculty_data.append(faculty_data_service.get_flat_faculty_data())
        return all_faculty_data
