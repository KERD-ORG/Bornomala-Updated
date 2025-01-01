from django.shortcuts import get_object_or_404
from program_app.models import Program
from department_app.models import Department
from college_app.models import College
from campus_app.models import Campus
from program_app.serializers import ProgramSerializer
from department_app.serializers import DepartmentSerializer
from college_app.serializers import CollegeSerializer
from campus_app.serializers import CampusSerializer
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from funding_app.serializers import FundingSerializer
from funding_app.models import Funding

class ProgramDataService:
    def __init__(self, program_id):
        self.program = self._get_program_by_id(program_id)

    def _get_program_by_id(self, program_id):
        try:
            return get_object_or_404(Program, id=program_id)
        except Exception as e:
            return None

    def get_program_data(self):
        if not self.program:
            return None
        return ProgramSerializer(self.program).data

    def get_department_data(self):
        if not self.program or not self.program.department:
            return None
        department = Department.objects.filter(id=self.program.department.id)[0]
        department_data = DepartmentSerializer(self.program.department).data

        # for i, department in enumerate(departments):
        # print(department)
        # print(department.id)
        # print(department.name)
        # department_data['funding'] = self.get_funding_data(department)
        # print(department_data['funding'])
        # print("department_data: ")
        # print(department_data)
        return department_data
    
    # def get_funding_data(self, department):
    #     """Get all programs for a given department"""
    #     funding = Funding.objects.filter(funding_for_dept=department)
     
    #     return FundingSerializer(funding, many=True ).data

    def get_funding_data(self):
        """Fetch all fundings related to the department"""
        if not  self.program.department:
            return []
        print(self.program.department)
        funding_data = Funding.objects.filter(funding_for_dept=self.program.department)
        return FundingSerializer(funding_data, many=True ).data

    def get_college_data(self):
        department = self.program.department
        if not department or not department.college:
            return None
        return CollegeSerializer(department.college).data

    def get_campus_data(self):
        department = self.program.department
        college = department.college if department else None
        if not college or not college.campus:
            return None
        return CampusSerializer(college.campus).data

    def get_organization_data(self):
        department = self.program.department
        college = department.college if department else None
        campus = college.campus if college else None
        if not campus or not campus.educational_organization:
            return None
        return EducationalOrganizationsSerializer(campus.educational_organization).data

    def get_full_program_data(self):
        if not self.program:
            return {
                'program': None,
                'funding':[],
                'department': None,
                'college': None,
                'campus': None,
                'organization': None,
            }
        return {
            'program': self.get_program_data(),
            'funding':self.get_funding_data(),
            'department': self.get_department_data(),
            'college': self.get_college_data(),
            'campus': self.get_campus_data(),
            'organization': self.get_organization_data(),
        }

    def flatten_data(self, data, prefix=""):
        """Helper function to flatten nested data with a specific prefix"""
        flat_data = {}
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, dict):
                    flat_data.update(self.flatten_data(value, f"{prefix}{key}_"))
                else:
                    flat_data[f"{prefix}{key}"] = value
        return flat_data

    def get_flat_program_data(self):
        """Flattened version of the full program data with dynamic prefixes"""
        full_data = self.get_full_program_data()
        print("full data:", full_data)
        flat_data = {}

        # Flatten the program data with a unique prefix based on program ID
        if full_data.get('program'):
            program_prefix = f"program_{self.program.id}_"
            flat_data.update(self.flatten_data(full_data['program'], prefix=program_prefix))

         # Flatten funding data with a unique prefix
        # if full_data.get('funding'):
        #     funding_id = full_data['funding'].get('id')
        #     funding_prefix = f"funding_{funding_id}_" if funding_id else "funding_"
        #     flat_data.update(self.flatten_data(full_data['funding'], prefix=funding_prefix))
        # Flatten funding data with unique prefixes for each funding entry
        if full_data.get('funding'):
            for funding_entry in full_data['funding']:
                funding_id = funding_entry.get('id')
                funding_prefix = f"funding_{funding_id}_" if funding_id else "funding_"
                flat_data.update(self.flatten_data(funding_entry, prefix=funding_prefix))

        # Flatten department data with a unique prefix
        if full_data.get('department'):

            department = full_data.get('department')
            department_id = full_data['department'].get('id')
            department_prefix = f"department_{department_id}_" if department_id else "department_"

            # # Flatten the programs under each department
            # if 'funding' in department:
            #     for funding in department['funding']:
            #         funding_prefix = f"funding_{funding['id']}_"
            #         print("fund prefix: " +funding_prefix)
            #         flat_data.update(self.flatten_data([funding], prefix=funding_prefix))
            # else:
                
            flat_data.update(self.flatten_data(full_data['department'], prefix=department_prefix))

            


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
    def get_all_flat_programs_data():
        """Returns flattened data for all programs"""
        return [
            ProgramDataService(program.id).get_flat_program_data()
            for program in Program.objects.all()
        ]
