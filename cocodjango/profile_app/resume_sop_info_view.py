from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.contrib.auth.models import User
from .models import UserDetails, Citizenship, Visa, ResearchInterest, EducationalBackground, Dissertation, ResearchExperience, Publication, WorkExperience, Skill, TrainingWorkshop, AwardGrantScholarship, VolunteerActivity
from rest_framework.permissions import IsAuthenticated
from auth_app.models import ExtendedUser
from django.utils.translation import gettext_lazy
from django.utils.translation import gettext_lazy as _
from django.shortcuts import get_object_or_404
from .serializers import UserBiographicInformationSerializer, ContactInformationSerializer, CitizenshipSerializer,  VisaSerializer, UserDetailsSerializer, ResearchInterestSerializer, EthnicityInfoSerializer, OtherInfoSerializer, AcknowledgementInfoSerializer, EducationalBackgroundSerializer, DissertationSerializer, ResearchExperienceSerializer, PublicationSerializer, WorkExperienceSerializer, SkillSerializer, TrainingWorkshopSerializer, AwardGrantScholarshipSerializer, VolunteerActivitySerializer
from .test_score_serializer import TestScoreSerializer
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from utils import upload_file
import os
import json
from django.db.models.fields.related import ForeignKey
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.storage import default_storage
from common.models import Document, UserDocument
from common.serializers import DocumentSerializer, UserDocumentSerializer, SkillOptions
from rest_framework.exceptions import ValidationError
from django.apps import apps
from django.core import serializers
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from global_messages import SUCCESS_MESSAGES as GLOBAL_SUCCESS_MESSAGES
from error_codes import ErrorCodes
from .serializers import ResumeUploadSerializer, SopUploadSerializer
from utils import get_response_template
from rest_framework import viewsets   
from django.forms.models import model_to_dict  
from rest_framework import serializers
from .models import TestScore
from .models import ReferenceInfo
from .reference_info_serializer import ReferenceInfoSerializer
from services import UserDataService

from .utils.text_data_extractionv2 import DataExtractor

import logging
import datetime
logger = logging.getLogger(__name__)
import environ

 
env = environ.Env()
environ.Env.read_env()  # Load the .env file

JSON_SCHEMA_PATH = env('JSON_SCHEMA_PATH')


class ResumeInfoView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Upload Resume"),
        operation_description=gettext_lazy(
            "Allows authenticated users to upload their resume file in PDF format."),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['resume'],
            properties={
                'resume': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_BINARY, description=gettext_lazy("Resume file in PDF format.")),
            }
        ),
        responses={
            201: openapi.Response(description=gettext_lazy("Success")),
            400: openapi.Response(description=gettext_lazy("Bad Request")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        }
    )
    @transaction.atomic
    def post(self, request, format=None):
        try:
            serializer = ResumeUploadSerializer(
                data=request.data, context={'request': request})
            if serializer.is_valid():
                # Get the latest uploaded resume document
                user = request.user
                user_document = UserDocument.objects.filter(user=user, use=UserDocument.RESUME).latest('created_at')
                resume_file_path = default_storage.path(user_document.document.file_name_system)

                # Extract text and map to database
                data_extractor = DataExtractor()
                # json_file_path = JSON_SCHEMA_PATH 
                json2 = self.generate_json("profile_app", exclude_models=['visa', 'citizenship' , 'researchinterest', "userdetails"])
                print(json2)  
                extracted_data = data_extractor.extract_applicant_data(resume_file_path, json2)
                print("extracted data from resumeinfoVIEW:")
                print(extracted_data)
                return Response({
                    'status': 'success',
                    'message':  gettext_lazy("Resume uploaded successfully."),
                    'data': extracted_data
                }, status=status.HTTP_201_CREATED)
            else:
                print(serializer.errors)
                return Response({
                    'status': 'error',
                    'message': gettext_lazy("Resume upload operation is failed."),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(str(e))
            return Response({
                'status': 'error',
                'message': gettext_lazy("Internal Server Error."),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Get Resume"),
        operation_description=gettext_lazy(
            "Allows authenticated users to fetch their uploaded resume file."),
        responses={
            200: openapi.Response(
                description=gettext_lazy("Success"),
                examples={
                    'application/json': {
                        'status': 'success',
                        'data': {
                            'resume': {
                                'file_name': 'resume.pdf',
                                'url': 'http://example.com/media/resume.pdf'
                            }
                        }
                    }
                }
            ),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        }
    )
    def get(self, request, format=None):
        user = request.user

        try:
            resume = UserDocument.objects.filter(
                user=user, use=UserDocument.RESUME).latest('created_at').document

            response_data = {
                'resume': {
                    'file_name': resume.file_name,
                    'url': default_storage.url(resume.file_name_system)
                }
            }

            return Response({
                'status': 'success',
                'message': gettext_lazy('Resume file is retrieved successfully.'),
                'data': response_data
            }, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            return Response({
                'status': 'success',
                'message': gettext_lazy('No resume file found.'),
                'data': None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'status': 'error',
                'message': gettext_lazy(str(e)),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)  
        
    def generate_json(self, app_name, exclude_models=[], exclude_fields=["id", "created_at", "deleted_at", "updated_at"]):
        app_config = apps.get_app_config(app_name)
        print("app config: ", app_config)
        output_json = {}

        for model in app_config.get_models():
            model_name = model.__name__.lower()
            print("model name: ", model_name)
            
            if (model_name not in exclude_models) and ("historical" not in model_name) :
                # Get the model's fields and create an empty JSON structure
                fields = model._meta.fields
                model_json = {}

                if model_name == "skill":
                    model_json["skill_option"] = ""
                
                if model._meta.many_to_many:
                    continue  # Skip ManyToMany fields for now
                
                for field in fields:
                    field_name = field.name
                    if field_name in exclude_fields or isinstance(field, ForeignKey):
                        continue
                    
                    # For foreign keys, store the related model's name
                    if field.many_to_one or field.many_to_many:
                        model_json[field_name] = ""
                    else:
                        model_json[field_name] = ""

                # Add an array for models related to UserDetails or single object if not
                if model_name.startswith('profile_app_userdetails'):
                    output_json[model_name] = model_json
                else:
                    output_json[model_name] = [model_json]
                
                    

       
        return  output_json
        
class SaveExtractedDataView(APIView):
    permission_classes = [IsAuthenticated]
    # @swagger_auto_schema(
    #     # method='post',
    #     operation_summary=gettext_lazy("Save Extracted Data"),
    #     operation_description=gettext_lazy(
    #         "Allows authenticated users to save extracted data from their resume."),
    #     request_body=openapi.Schema(
    #         type=openapi.TYPE_OBJECT,
    #         required=['extracted_data'],
    #         properties={
    #             'extracted_data': openapi.Schema(type=openapi.TYPE_OBJECT, description=gettext_lazy("Extracted data from resume.")),
    #         }
    #     ),
    #     responses={
    #         200: openapi.Response(description=gettext_lazy("Data saved successfully.")),
    #         400: openapi.Response(description=gettext_lazy("Bad Request")),
    #         500: openapi.Response(description=gettext_lazy("Internal Server Error"))
    #     } 
    # )
    @transaction.atomic
    def post(self, request, format=None):
        user = request.user
        extracted_data = request.data.get('extracted_data', {})

        print("extracted data in extraction view:" )
        print(extracted_data)

        try:
            self.map_extracted_data_to_db(extracted_data, request)
            return Response({
                'status': 'success',
                'message': gettext_lazy("Data saved successfully.")
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(str(e))
            return Response({
                'status': 'error',
                'message': gettext_lazy("Internal Server Error."),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def validate_date(self, date_str):
        try:
            datetime.datetime.strptime(date_str, '%Y-%m-%d')
            return date_str
        except ValueError:
            return None

    def ensure_valid_data(self, model_serializer, data):
        validated_data = {}
        for field in model_serializer().get_fields():
            if field == "id":
                continue
            
            if field not in data or data[field] in [None, '', 'null']:
                
                if isinstance(model_serializer().get_fields()[field], serializers.DateField):
                    print("ensure valid data")
                    print(field)
                    if field == "end_date": 
                        print("valid end date")
                        validated_data[field] = datetime.datetime.today().strftime('%Y-%m-%d')
                        print("field end date: ", validated_data[field])
                    else:
                        validated_data[field] = self.validate_date('2024-01-01')
                    print(validated_data[field])
                    print(type(validated_data[field]))
                elif isinstance(model_serializer().get_fields()[field], serializers.FloatField):
                    validated_data[field] = 0.0
                elif isinstance(model_serializer().get_fields()[field], serializers.BooleanField):
                    validated_data[field] = False
                elif isinstance(model_serializer().get_fields()[field], serializers.PrimaryKeyRelatedField):
                    validated_data[field] = None
                elif isinstance(model_serializer().get_fields()[field], serializers.CharField):
                    validated_data[field] = "N/A"

                else:
                    validated_data[field] = None
            else:
                validated_data[field] = data[field]

            if field == "rank":
                validated_data[field] = 1 
            if field == "end_date" and validated_data[field] == "Present":
                validated_data[field] = datetime.datetime.today().strftime('%Y-%m-%d')

        return validated_data
    
    @transaction.atomic
    def map_extracted_data_to_db(self, extracted_data, request):
        print("in map_extracted_data")
        for item in extracted_data:
            print("item: extracted_data")
            if 'testscore' in item:
                print("in profile_app_testscore")
                for test_score_data in item['testscore']:
                    # test_score_data['user'] = user  # Add user ID to data
                    print(test_score_data) 
                    validated_test_score_data = self.ensure_valid_data(TestScoreSerializer, test_score_data)
                    test_score_serializer = TestScoreSerializer(data=validated_test_score_data, context={'request': request})
                    print("TestScoreSerializer: ", test_score_serializer)
                    if test_score_serializer.is_valid():
                        print("test score valid")
                        print(validated_test_score_data)
                        user_details = UserDetails.objects.get(user=request.user)
                        existing_test_score = TestScore.objects.filter(user_details=user_details, test_name=validated_test_score_data['test_name']).first()
                        if existing_test_score:
                            print("exists")
                            if validated_test_score_data['score']:
                                existing_test_score.score = validated_test_score_data['score']
                            if validated_test_score_data['date_taken']:
                                existing_test_score.date_taken = validated_test_score_data['date_taken']
                            existing_test_score.save()
                        else:
                            print("new data")
                            test_score_serializer.save() 
                            print("test_score saved successfully")
                    else:
                        print("Test Score Data Error:", test_score_serializer.errors)
            
            if 'educationalbackground' in item:
                for edu_data in item['educationalbackground']:
                    print("edu data: %s" % edu_data)
                    validated_edu_data = self.ensure_valid_data(EducationalBackgroundSerializer, edu_data)
                    print("validatededu data: %s" % validated_edu_data)
                    edu_serializer = EducationalBackgroundSerializer(data=validated_edu_data, context={'request': request})
                    print(edu_serializer)
                    if edu_serializer.is_valid():
                        print("edu data valid")
                        user_details = UserDetails.objects.get(user=request.user)
                        existing_edu = EducationalBackground.objects.filter(user_details=user_details, institution_name=validated_edu_data['institution_name']).first()
                        if existing_edu:
                            print("Found existing")
                            if validated_edu_data['major']:
                                existing_edu.major = validated_edu_data['major']
                            if validated_edu_data['rank']:
                                existing_edu.rank = validated_edu_data['rank']
                            if validated_edu_data['start_date']:
                                existing_edu.start_date = validated_edu_data['start_date']
                            if validated_edu_data['end_date']:
                                existing_edu.end_date = validated_edu_data['end_date']
                            if validated_edu_data['degree_date']:
                                existing_edu.degree_date = validated_edu_data['degree_date']
                            existing_edu.save()
                        else:
                            print("new edu data")
                            edu_serializer.save()
                            print("new edu data saved")
                    else:
                        print("Educational Background Data Error:", edu_serializer.errors)

            if 'workexperience' in item:
                for work_data in item['workexperience']:
                   
                    validated_work_data = self.ensure_valid_data(WorkExperienceSerializer, work_data)
                    print("validated work_data: ", validated_work_data)
                    work_serializer = WorkExperienceSerializer(data=validated_work_data, context={'request': request})
                    print("work_serializer: ", work_serializer)
                    if work_serializer.is_valid():
                        print("work data is valid: ")
                        user_details = UserDetails.objects.get(user=request.user)
                        existing_work = WorkExperience.objects.filter(user_details=user_details, company_name=validated_work_data['company_name'], position_title=validated_work_data['position_title']).first()
                        if existing_work:
                            print("Work already exist")
                            if validated_work_data['location']:
                                existing_work.location = validated_work_data['location']
                            if validated_work_data['start_date']:
                                existing_work.start_date = validated_work_data['start_date']
                            if validated_work_data['end_date']:
                                existing_work.end_date = validated_work_data['end_date']
                            existing_work.save()
                        else:
                            print("new work data")
                            work_serializer.save()
                            print("work data saved")
                    else:
                        print("Work Experience Data Error:", work_serializer.errors)

            if 'publication' in item:
                for publication_data in item['publication']:
                   
                    validated_publication_data = self.ensure_valid_data(PublicationSerializer, publication_data)
                    print("validated publication_data: ", validated_publication_data)
                    publication_serializer = PublicationSerializer(data=validated_publication_data, context={'request': request})
                    print("publicationserializer: ", publication_serializer)
                    if publication_serializer.is_valid():
                        print("publication data is valid: ")
                        user_details = UserDetails.objects.get(user=request.user)
                        existing_publication = Publication.objects.filter(user_details=user_details, title=validated_publication_data['title']).first()
                        if existing_publication:
                            print("publication already exist")
                            if validated_publication_data['title']:
                                existing_publication.title = validated_publication_data['title']
                            if validated_work_data['publication_date']:
                                existing_publication.publication_date = validated_publication_data['publication_date']
                            if validated_work_data['abstract']:
                                existing_publication.abstract = validated_publication_data['abstract']
                            if validated_work_data['name']:
                                existing_publication.name = validated_publication_data['name']
                            if validated_work_data['doi_link']:
                                existing_publication.doi_link = validated_publication_data['doi_link']
                            if validated_work_data['publication_type']:
                                existing_publication.publication_type = validated_publication_data['publication_type']
                            existing_publication.save()
                        else:
                            print("new publication data")
                            publication_serializer.save()
                            print("publication data saved")
                    else:
                        print("publication  Data Error:", publication_serializer.errors)

            if 'skill' in item:
                for skill_data in item['skill']:
                    skill_name = skill_data.get('skill_option', '').strip()
                    if not skill_name:
                        continue
                    
                    skill_option = SkillOptions.objects.filter(skill_name__iexact=skill_name).first()
                    if not skill_option:
                        skill_option = SkillOptions.objects.create(user_id=request.user.id, skill_name=skill_name)
                    
                    skill_data['skill_option_id'] = skill_option.id
                    user_details = UserDetails.objects.get(user=request.user)
                    skill_data['user_details'] = user_details.id

                    
                    validated_skill_data = self.ensure_valid_data(SkillSerializer, skill_data)
                    print("validated_skill_data:", validated_skill_data)
                    skill_serializer = SkillSerializer(data=validated_skill_data, context={'request': request})
                    print("skill_serializer:", skill_serializer)
                    if skill_serializer.is_valid():
                        print("skill valid")
                        
                        existing_skill = Skill.objects.filter(user_details=user_details, skill_option=skill_option).first()
                        if not existing_skill:
                            print("new")
                            skill_serializer.save()
                            print("saved skill")
                    else:
                        print("Skill Data Error:", skill_serializer.errors)

            if 'volunteeractivity' in item:
                for volunteer_data in item['volunteeractivity']:
                    
                    validated_volunteer_data = self.ensure_valid_data(VolunteerActivitySerializer, volunteer_data)
                    print("validated_volunteer_data: ", validated_volunteer_data)
                    volunteer_serializer = VolunteerActivitySerializer(data=validated_volunteer_data, context={'request': request}) #context={'request': request}
                    if volunteer_serializer.is_valid():
                        print("Volunteer valid")
                        user_details = UserDetails.objects.get(user=request.user)
                        existing_volunteer = VolunteerActivity.objects.filter(user_details=user_details, organization_name=validated_volunteer_data['organization_name'], designation=validated_volunteer_data['designation']).first()
                        if existing_volunteer:
                            print("exists volunteer")
                            if validated_volunteer_data['role_description']:
                                existing_volunteer.role_description = validated_volunteer_data['role_description']
                            if validated_volunteer_data['start_date']:
                                existing_volunteer.start_date = validated_volunteer_data['start_date']
                            if validated_volunteer_data['end_date']:
                                existing_volunteer.end_date = validated_volunteer_data['end_date']
                            existing_volunteer.save()
                        else:
                            print("new volunteer")
                            volunteer_serializer.save()
                    else:
                        print("Volunteer Activity Data Error:", volunteer_serializer.errors)


class SopInfoView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Upload SOP"),
        operation_description=gettext_lazy(
            "Allows authenticated users to upload their statement of purpose (SOP) file in PDF format."),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['sop'],
            properties={
                'sop': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_BINARY, description=_('SOP file in PDF format.')),
            }
        ),
        responses={
            201: openapi.Response(description=gettext_lazy("Success")),
            400: openapi.Response(description=gettext_lazy("Bad Request")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        },
        tags=['SOP']
    )
    @ transaction.atomic
    def post(self, request, format=None):
        try:
            serializer = SopUploadSerializer(
                data=request.data, context={'request': request})
            if serializer.is_valid():
                return Response({
                    'status': 'success',
                    'message':  gettext_lazy("SOP uploaded successfully."),
                    'data': {}
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'status': 'error',
                    'message': gettext_lazy("SOP upload operation is failed."),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': gettext_lazy("Internal Server Error."),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @ swagger_auto_schema(
        operation_summary=_("Get SOP"),
        operation_description=gettext_lazy(
            "Allows authenticated users to fetch their uploaded statement of purpose (SOP) file."),
        responses={
            200: openapi.Response(
                description=gettext_lazy("Success"),
                examples={
                    'application/json': {
                        'status': 'success',
                        'data': {
                            'sop': {
                                'file_name': 'sop.pdf',
                                'url': 'http://example.com/media/sop.pdf'
                            }
                        }
                    }
                }
            ),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        }
    )
    @transaction.atomic
    def get(self, request, format=None):
        user = request.user

        try:
            sop = UserDocument.objects.filter(
                user=user, use=UserDocument.SOP).latest('created_at').document

            response_data = {
                'sop': {
                    'file_name': sop.file_name,
                    'url': default_storage.url(sop.file_name_system)
                }
            }

            return Response({
                'status': 'success',
                'message': gettext_lazy('SOP file is retrieved successfully.'),
                'data': response_data
            }, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            return Response({
                'status': 'success',
                'message': gettext_lazy('No SOP file found.'),
                'data': None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'status': 'error',
                'message': gettext_lazy(str(e)),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

