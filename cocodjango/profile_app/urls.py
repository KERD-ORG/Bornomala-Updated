from django.urls import path
from .views import UserBiographicInfoView, UserContactInfoView, CitizenshipAndVisaInfoView, VisaInfoView, ResearchInterestInfoView, EthnicityInfoView, OtherInfoView, AcknowledgementInfoView, SkillInfoView, VolunteerActivityView
#from .educational_background_views import AcademicHistoryView, UpdateRankView
from .academic_history_view import AcademicHistoryView
from .publication_view import PublicationView
from .reference_info_views import ReferenceInfoView
from . import publication_view
from .work_experience_view import WorkExperienceView
from .training_workshop_view import TrainingWorkshopView
from .award_grant_scholarship_view import AwardGrantScholarshipView
from .research_experience_view import ResearchExperienceView
from .dissertation_view import DissertationView
from .test_score_view import TestScoreView
from .resume_sop_info_view import ResumeInfoView, SopInfoView, SaveExtractedDataView
  

urlpatterns = [
    path('user_biographic_info_details/',
         UserBiographicInfoView.as_view(), name='user_biographic_info'),
    path('user_research_interest_info_details/',
         ResearchInterestInfoView.as_view(), name='user_research_interest_info'),
    path('user_contact_info_details/',
         UserContactInfoView.as_view(), name='user_contact_info'),
    path('user_resume_info_details/',
         ResumeInfoView.as_view(), name='user_resume_info'),
    path('user_sop_info_details/',
         SopInfoView.as_view(), name='user_sop_info'),
    path('user_ethnicity_info_details/',
         EthnicityInfoView.as_view(), name='user_ethnicity_info'),
    path('user_other_info_details/',
         OtherInfoView.as_view(), name='user_other_info'),
    path('user_acknowledgement_info_details/',
         AcknowledgementInfoView.as_view(), name='user_acknowledgement_info'),
    path('academic_history/', AcademicHistoryView.as_view(),
         name='academic-history'),
    path('academic_history/<int:pk>/', AcademicHistoryView.as_view(),
         name='academic-history-detail'),
    #path('update_ranks/', UpdateRankView.as_view(), name='update_ranks'),

    path('dissertations/', DissertationView.as_view(), name='dissertations'),
    path('dissertations/<int:pk>/', DissertationView.as_view(), name='dissertation-detail'),
    path('research_experiences/', ResearchExperienceView.as_view(), name='research-experiences'),
    path('research_experiences/<int:pk>/', ResearchExperienceView.as_view(), name='research-experience-detail'),
    path('publications/', PublicationView.as_view(), name='publications'),
    path('publications/<int:pk>/', PublicationView.as_view(), name='publication-detail'),
    path('work_experiences/', WorkExperienceView.as_view(), name='work-experiences'),
    path('work_experiences/<int:pk>/', WorkExperienceView.as_view(), name='work-experience-detail'),
    path('skills/', SkillInfoView.as_view(), name='skills'),
    path('training_workshops/', TrainingWorkshopView.as_view(), name='training-workshops'),
    path('training_workshops/<int:pk>/', TrainingWorkshopView.as_view(), name='training-workshop-detail'),
    path('awards_grants_scholarships/', AwardGrantScholarshipView.as_view(), name='awards-grants-scholarships'),
    path('awards_grants_scholarships/<int:pk>/', AwardGrantScholarshipView.as_view(), name='award-grant-scholarship-detail'),
    path('publication_type_list/', publication_view.publication_type_list, name='publication_type_list'),
    path('volunteer_activities/', VolunteerActivityView.as_view(), name='volunteer-activities'),
    path('volunteer_activities/<int:pk>/', VolunteerActivityView.as_view(), name='volunteer-activity-detail'),
    path('references/', ReferenceInfoView.as_view(), name='references'),
    path('references/<int:pk>/', ReferenceInfoView.as_view(), name='reference-detail'),
    path('test_scores/', TestScoreView.as_view(), name='test_scores'),
    path('test_scores/<int:pk>/', TestScoreView.as_view(), name='test_scores_detail'),
    path('user_citizenship_info_details/', CitizenshipAndVisaInfoView.as_view(), name='citizenship_information'),
    path('user_citizenship_info_details/<int:pk>/', CitizenshipAndVisaInfoView.as_view(), name='citizenship_information_detail'),
    path('user_visa_info_details/', VisaInfoView.as_view(), name='visa_information'),
    path('user_visa_info_details/<int:pk>/', VisaInfoView.as_view(), name='visa_information_detail'),
    path('save-extracted-data/', SaveExtractedDataView.as_view(), name='save_extracted_data'),

]
