from django.shortcuts import get_object_or_404
from department_app.models import Department
from college_app.models import College
from campus_app.models import Campus
from department_app.serializers import DepartmentSerializer
from college_app.serializers import CollegeSerializer
from campus_app.serializers import CampusSerializer
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from program_app.serializers import ProgramSerializer
from program_app.models import Program


class DepartmentDataService:
    def __init__(self, department_id):
        self.department = self._get_department_by_id(department_id)

    def _get_department_by_id(self, department_id):
        try:
            return get_object_or_404(Department, id=department_id)
        except Exception as e:
            return None

    def get_department_data(self):
        if not self.department:
            return None
        return DepartmentSerializer(self.department).data

    # def get_program_data(self):
    #     """Fetch all programs related to the department"""
    #     if not self.department:
    #         return []
    #     programs = self.department.program_set.all()
    #     return ProgramSerializer(programs, many=True).data
    def get_program_data(self):
        """Fetch all programs related to the department"""
        if not self.department:
            return []
        programs = Program.objects.filter(department=self.department)
        return ProgramSerializer(programs, many=True).data

    def get_college_data(self):
        if not self.department or not self.department.college:
            return None
        return CollegeSerializer(self.department.college).data

    def get_campus_data(self):
        college = self.department.college
        if not college or not college.campus:
            return None
        return CampusSerializer(college.campus).data

    def get_organization_data(self):
        college = self.department.college
        if not college or not college.campus or not college.campus.educational_organization:
            return None
        return EducationalOrganizationsSerializer(college.campus.educational_organization).data

    def get_full_department_data(self):
        if not self.department:
            return {
                'department': None,
                'programs': [],
                'college': None,
                'campus': None,
                'organization': None,
            }
        return {
            'department': self.get_department_data(),
            'programs': self.get_program_data(),
            'college': self.get_college_data(),
            'campus': self.get_campus_data(),
            'organization': self.get_organization_data(),
        }

    def flatten_data(self, data, prefix=""):
        """Helper function to flatten nested data"""
        flat_data = {}
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, dict):
                    flat_data.update(self.flatten_data(value, f"{prefix}{key}_"))
                else:
                    flat_data[f"{prefix}{key}"] = value
        return flat_data

    def get_flat_department_data(self):
        """Flattened version of the full department data with dynamic prefixes"""
        full_data = self.get_full_department_data()
        flat_data = {}

        # Flatten the department data with a unique prefix based on department ID
        if full_data.get('department'):
            dept_data = full_data['department']
            department_prefix = f"department_{self.department.id}_"
            flat_data.update(self.flatten_data(full_data['department'], prefix=department_prefix))

            # Flatten the programs under each department
            # if 'programs' in dept_data:
            #     for program in dept_data['programs']:
            #         program_prefix = f"program_{program['id']}_"
            #         flat_data.update(self.flatten_data([program], prefix=program_prefix))

        # # Flatten program data with unique prefixes for each program
        if full_data.get('programs'):
            for program in full_data['programs']:
                program_prefix = f"program_{program['id']}_"
                flat_data.update(self.flatten_data(program, prefix=program_prefix))

        # Flatten college data with a unique prefix
        if full_data.get('college'):
            college_id = full_data['college'].get('id')
            college_prefix = f"college_{college_id}_" if college_id else "college_"
            flat_data.update(self.flatten_data(full_data['college'], prefix=college_prefix))

        # Flatten campus data with a unique prefix
        if full_data.get('campus'):
            campus_id = full_data['campus'].get('id')
            campus_prefix = f"campus_{campus_id}_" if campus_id else "campus_"
            flat_data.update(self.flatten_data(full_data['campus'], prefix=campus_prefix))

        # Flatten organization data with a unique prefix
        if full_data.get('organization'):
            organization_id = full_data['organization'].get('id')
            organization_prefix = f"organization_{organization_id}_" if organization_id else "organization_"
            flat_data.update(self.flatten_data(full_data['organization'], prefix=organization_prefix))

        return flat_data

    @staticmethod
    def get_all_flat_departments_data():
        """Returns flattened data for all departments"""
        return [
            DepartmentDataService(department.id).get_flat_department_data()
            for department in Department.objects.all()
        ]
