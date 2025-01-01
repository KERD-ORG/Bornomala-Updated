from django.forms.models import model_to_dict
from django.shortcuts import get_object_or_404
from profile_app.models import (
    UserDetails, ResearchInterest, EducationalBackground, Dissertation,
    ResearchExperience, Publication, WorkExperience, Skill, TrainingWorkshop,
    AwardGrantScholarship, TestScore, VolunteerActivity, ReferenceInfo, Visa, Citizenship
)
from profile_app.serializers import UserBiographicInformationSerializer, ContactInformationSerializer, CitizenshipSerializer,  VisaSerializer, ResearchInterestSerializer, EthnicityInfoSerializer, OtherInfoSerializer, EducationalBackgroundSerializer, DissertationSerializer, ResearchExperienceSerializer, PublicationSerializer, WorkExperienceSerializer, SkillSerializer, TrainingWorkshopSerializer, AwardGrantScholarshipSerializer, VolunteerActivitySerializer
from profile_app.reference_info_serializer import ReferenceInfoSerializer
from profile_app.test_score_serializer import TestScoreSerializer
from common.models import UserDocument
from django.core.files.storage import default_storage
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from funding_app.models import Funding
from funding_app.serializers import FundingSerializer


class ResearcherDataService:
    def __init__(self, user, user_type=None):
        self.user = user
        self.user_type = user_type  # Add this line
        try:
            self.user_details = get_object_or_404(UserDetails, user=user)
            user_data = get_object_or_404(User, id=user)
            user_data_main = {
                'user_id': user_data.id,
                'username': user_data.username,
                'first_name': user_data.first_name,
                'last_name': user_data.last_name,
                'email': user_data.email,
                'date_joined': user_data.date_joined,
               'groups': list(user_data.groups.values_list('name', flat=True))

            }
            self.user_data = [user_data_main]
        except Exception as e:
            self.user_details = None
            self.user_data = None

            
          
    def get_ethnicity_informations(self):
        if not self.user_details:
            return []
        serializer = EthnicityInfoSerializer(self.user_details)
        return serializer.data

    
    def get_other_informations(self):
        if not self.user_details:
            return []
        serializer = OtherInfoSerializer(self.user_details)
        return serializer.data

    
    def get_biographic_informations(self):
        if not self.user_details:
            return []
        serializer = UserBiographicInformationSerializer(self.user_details)
        return serializer.data
    
    def get_funding_data(self):
        """Fetch all fundings related to the department"""
        if not  self.user_details.department:
            return []
        # print(self.program.department)
        funding_data = Funding.objects.filter(funding_for_faculty_member=self.user_details.user)
        print("funding data:", funding_data)
        return FundingSerializer(funding_data, many=True ).data

    
    def get_contact_informations(self):
        if not self.user_details:
            return []
        serializer = ContactInformationSerializer(self.user_details)
        return serializer.data

    def get_citizenship_informations(self):
        if not self.user_details:
            return []
        citizenships = Citizenship.objects.filter(
            user_details=self.user_details)
        serializer = CitizenshipSerializer(citizenships, many=True)
        return serializer.data

    def get_visa_informations(self):
        if not self.user_details:
            return []
        visas = Visa.objects.filter(user_details=self.user_details)
        serializer = VisaSerializer(visas, many=True)
        return serializer.data

    def get_research_interests(self):
        if not self.user_details:
            return []
        research_interests = ResearchInterest.objects.filter(
            user_details=self.user_details)
        serializer = ResearchInterestSerializer(research_interests, many=True)
        return serializer.data

    def get_educational_backgrounds(self):
        if not self.user_details:
            return []
        educational_backgrounds = EducationalBackground.objects.filter(
            user_details=self.user_details)
        serializer = EducationalBackgroundSerializer(
            educational_backgrounds, many=True)
        return serializer.data

    def get_dissertations(self):
        if not self.user_details:
            return []
        dissertation = Dissertation.objects.filter(user_details=self.user_details)
        serializer = DissertationSerializer(dissertation, many=True)
        return serializer.data

    def get_research_experiences(self):
        if not self.user_details:
            return []
        research_experience = ResearchExperience.objects.filter(user_details=self.user_details)
        serializer = ResearchExperienceSerializer(research_experience, many=True)
        return serializer.data

    def get_publications(self):
        if not self.user_details:
            return []
        publications = Publication.objects.filter(user_details=self.user_details)
        serializer = PublicationSerializer(publications, many=True)
        return serializer.data

    def get_work_experiences(self):
        if not self.user_details:
            return []
        work_experiences = WorkExperience.objects.filter(user_details=self.user_details)
        serializer = WorkExperienceSerializer(work_experiences, many=True)
        return serializer.data

    def get_skills(self):
        if not self.user_details:
            return []
        skills = Skill.objects.filter(user_details=self.user_details)
        serializer = SkillSerializer(skills, many=True)
        return serializer.data

    def get_training_workshops(self):
        if not self.user_details:
            return []
        training_workshops = TrainingWorkshop.objects.filter(user_details=self.user_details)
        serializer = TrainingWorkshopSerializer(training_workshops, many=True)
        return serializer.data

    def get_awards_grants_scholarships(self):
        if not self.user_details:
            return []
        award_grant_scholarship = AwardGrantScholarship.objects.filter(user_details=self.user_details)
        serializer = AwardGrantScholarshipSerializer(award_grant_scholarship, many=True)
        return serializer.data

    def get_test_scores(self):
        if not self.user_details:
            return []
        test_score = TestScore.objects.filter(user_details=self.user_details)
        serializer = TestScoreSerializer(test_score, many=True)
        return serializer.data

    def get_volunteer_activities(self):
        if not self.user_details:
            return []
        volunteer_activities = VolunteerActivity.objects.filter(user_details=self.user_details)
        serializer = VolunteerActivitySerializer(volunteer_activities, many=True)
        return serializer.data

    def get_references(self):
        if not self.user_details:
            return []
        reference = ReferenceInfo.objects.filter(user_details=self.user_details)
        serializer = ReferenceInfoSerializer(reference, many=True)
        return serializer.data
    
    def get_resume(self):
        if not self.user_details:
            pass
        else:
            resume_query = UserDocument.objects.filter(
                user=self.user, use=UserDocument.RESUME
            )
            if resume_query.exists():
                latest_resume = resume_query.latest('created_at')
                if latest_resume.document.file_name:
                    response_data = {
                        'file_name': latest_resume.document.file_name,
                        'url': default_storage.url(latest_resume.document.file_name_system)
                    }
                    return [response_data]
        return []

    def get_sop(self):
        if not self.user_details:
            pass
        else:
            sop_query = UserDocument.objects.filter(
                user=self.user, use=UserDocument.SOP
            )
            if sop_query.exists():
                latest_sop = sop_query.latest('created_at')
                if latest_sop.document.file_name:
                    response_data = {
                        'file_name': latest_sop.document.file_name,
                        'url': default_storage.url(latest_sop.document.file_name_system)  
                    }
                    return [response_data]
        return []

    def get_user_data(self):
        if not self.user_details:
            return {
                'user_main':  [],
                'user_details': [],
                'resume': None,
                'sop': None,
                'biographic_informations': [],
                'contact_informations': [],
                'ethnicity_informations': [],
                'other_informations': [],
                'citizenships': [],
                'visas': [],
                'research_interests': [],
                'academic_histories': [],
                'dissertations': [],
                'research_experiences': [],
                'publications': [],
                'work_experiences': [],
                'skills': [],
                'training_workshops': [],
                'awards_grants_scholarships': [],
                'test_scores': [],
                'volunteer_activities': [],
                'references': [],
                'funding':[],
            }
        return {
            'user_main': self.user_data,
            'user_details': model_to_dict(self.user_details),
            'resume': self.get_resume(),
            'sop': self.get_sop(),
            'biographic_informations': self.get_biographic_informations(),
            'contact_informations': self.get_contact_informations(),
            'ethnicity_informations': self.get_ethnicity_informations(),
            'other_informations': self.get_other_informations(),
            'citizenships': self.get_citizenship_informations(),
            'visas': self.get_visa_informations(),
            'research_interests': self.get_research_interests(),
            'academic_histories': self.get_educational_backgrounds(),
            'dissertations': self.get_dissertations(),
            'research_experiences': self.get_research_experiences(),
            'publications': self.get_publications(),
            'work_experiences': self.get_work_experiences(),
            'skills': self.get_skills(),
            'training_workshops': self.get_training_workshops(),
            'awards_grants_scholarships': self.get_awards_grants_scholarships(),
            'test_scores': self.get_test_scores(),
            'volunteer_activities': self.get_volunteer_activities(),
            'references': self.get_references(),
            'funding':self.get_funding_data(),
        }

    @staticmethod
    def get_all_users_data(user_types=[], group_name=None):
        all_users = User.objects.all()
        if user_types:
            # Filter based on user_type if provided
            all_users = all_users.filter(userdetails__user_type_in=user_types)
        if group_name:
            all_users = all_users.filter(groups__name=group_name)

        all_users_data = []
        for user in all_users:
            user_data_service = ResearcherDataService(
                user.id, user_types)  # Pass user_type
            all_users_data.append(user_data_service.get_user_data())
        return all_users_data

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
                print(
                    f"Item {i} is not a dictionary: {item} (type: {type(item)})")
                flat_data[f"{prefix}{i}_value"] = str(item)

        return flat_data

    def get_flat_user_data(self):
        user_data = self.get_user_data()
        # print("user data: ", user_data)
        flat_data = {
            # **self.flatten_data(user_data['biographic_informations'], 'biographic_'),
            # **self.flatten_data(user_data['contact_informations'], 'contact_'),
            # **self.flatten_data(user_data['ethnicity_informations'], 'ethnicity_'),
            # **self.flatten_data(user_data['other_informations'], 'other_'),
            **self.flatten_data(user_data['citizenships'], 'citizenship_'),
            **self.flatten_data(user_data['visas'], 'visa_'),
            # **self.flatten_data(user_data['research_interests'], 'research_interest_'),
            **self.flatten_data(user_data['academic_histories'], 'academic_'),
            **self.flatten_data(user_data['dissertations'], 'dissertation_'),
            **self.flatten_data(user_data['research_experiences'], 'research_experience_'),
            **self.flatten_data(user_data['publications'], 'publication_'),
            **self.flatten_data(user_data['work_experiences'], 'work_experience_'),
            # **self.flatten_data(user_data['skills'], 'skill_'),
            **self.flatten_data(user_data['training_workshops'], 'training_workshop_'),
            **self.flatten_data(user_data['awards_grants_scholarships'], 'award_grant_scholarship_'),
            **self.flatten_data(user_data['test_scores'], 'test_score_'),
            **self.flatten_data(user_data['volunteer_activities'], 'volunteer_activity_'),
            **self.flatten_data(user_data['funding'], 'funding_'),
            # **self.flatten_data(user_data['references'], 'reference_'),
            # **self.flatten_data(user_data['resume'], 'resume_'),
            # **self.flatten_data(user_data['sop'], 'sop_')
        }
       

        flat_data.update({
            'user_main': user_data['user_main'],
            'user_details': user_data['user_details'],
            'resume': user_data['resume'],
            'sop': user_data['sop'],
        })
        return flat_data

    @staticmethod
    def get_all_flat_users_data(user_types=[], group_name=None):
        all_users = User.objects.all()
       
        if user_types:
            # Filter based on user_type if provided
            all_users = all_users.filter(userdetails__user_type__in=user_types)
        if group_name:
            all_users = all_users.filter(groups__name=group_name)

        all_users_data = []
        for user in all_users:
            user_data_service = ResearcherDataService(
                user.id, user_types)  # Pass user_type
            all_users_data.append(user_data_service.get_flat_user_data())
        return all_users_data






# Get all users
#all_users = UserDataService.get_all_users_data()

# Get all users of a specific type
#filtered_users = UserDataService.get_all_users_data(user_type='Lecturer')

# Get flat data for all users
#all_flat_users = UserDataService.get_all_flat_users_data()

# roles = [
#     'Professor', 'Administrator', 'Researcher', 'Lecturer', 'Assistant Professor',
#     'Associate Professor', 'Dean', 'Director', 'Coordinator', 'Staff',
#     'Postdoctoral Researcher', 'Visiting Scholar', 'Graduate Assistant',
#     'Department Manager', 'Department Chair', 'Clinical Faculty',
#     'Adjunct Faculty', 'Faculty Emeritus', 'Laboratory Manager', 'Academic Advisor'
# ]

# Get flat data for users of a specific type
#filtered_flat_users = UserDataService.get_all_flat_users_data(user_types=roles)

#'Professor, Administrator, Researcher, Lecturer, Assistant Professor, '
#'Associate Professor, Dean, Director, Coordinator, Staff, '
#'Postdoctoral Researcher, Visiting Scholar, Graduate Assistant, '
#'Department Manager, Department Chair, Clinical Faculty, '
#'Adjunct Faculty, Faculty Emeritus, Laboratory Manager, Academic Advisor'



#filtered_users_by_group = UserDataService.get_all_users_data(group_name='Student')
#UserDataService.get_all_flat_users_data(group_name='Student')