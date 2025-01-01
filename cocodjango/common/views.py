import json
from django.conf import settings
import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from .models import ResearchInterestOptions
from .serializers import ResearchInterestOptionsSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.serializers import serialize
from .models import Document, UserDocument, State, EthnicityOptions, Language, TitleOptions, UserTypeOptions
from educational_organizations_app.models import EducationalOrganizationsCategory
from .serializers import DocumentSerializer, UserDocumentSerializer
from utils import log_request_error, upload_file,get_model_class,get_serializer_class,delete_uploaded_files,get_response_template,edit_file,extract_data_file
from rest_framework.exceptions import ValidationError
from utils import upload_file
from rest_framework.exceptions import ValidationError
from utils import get_response_template,get_model_class,get_serializer_class
import os
from drf_yasg.utils import swagger_auto_schema
from django_countries import countries
from drf_yasg import openapi
from django.utils.translation import gettext_lazy
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from global_messages import SUCCESS_MESSAGES as GLOBAL_SUCCESS_MESSAGES
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from .serializers import *
from django.db import IntegrityError, transaction
from utils import upload_file , edit_file
from django.contrib.auth.models import User
from django.db.models.functions import TruncMonth
from django.db.models import Count
from calendar import month_name
from datetime import datetime
import requests

from profile_app.models import UserDetails
from django.db.models import Count, Case, When, IntegerField,F,Q, Sum
from django.contrib.auth.models import User
from django.db.models.functions import TruncMonth,TruncYear,TruncDay
from django.db.models import Count
from calendar import month_name
from datetime import datetime
from django.db import IntegrityError, transaction
from django.core.files.storage import FileSystemStorage
from campus_app.serializers import CampusSerializer
from college_app.serializers import CollegeSerializer
from educational_organizations_app.models import EducationalOrganizations
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from campus_app.models import Campus
from campus_app.serializers import CampusSerializer
from college_app.models import College
from college_app.serializers import CollegeSerializer
from department_app.models import Department
from department_app.serializers import DepartmentSerializer
from department_app.serializers import DepartmentSerializer
from faculty_members_app.models import FacultyMembers
from auth_app.serializers import UserSerializer
from funding_app.models import Funding
from funding_app.serializers import FundingSerializer
from faculty_members_app.serializers import FacultyMembersSerializer
from calendar import month_name, monthrange
from django.db.models import Count, Case, When, IntegerField, Q
from django.db.models.functions import TruncMonth, TruncDay, TruncYear
import psutil
import re
from django.conf import settings
from common import emails
from common.base_models import CustomGroup

@swagger_auto_schema(
    method='get',
    operation_summary="Get Research Interest Options",
    operation_description="Retrieve a list of research interest options filtered by a query string. The query string allows filtering research interests by topic.",
    manual_parameters=[
        openapi.Parameter(
            'query',
            openapi.IN_QUERY,
            description="Query string to filter research interests by topic",
            type=openapi.TYPE_STRING,
            examples={
                "example": {"value": "machine learning"}
            }
        )
    ],
    responses={
        200: openapi.Response(
            description="A list of research interest options",
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='ID of the research interest', example=1),
                        'topic': openapi.Schema(type=openapi.TYPE_STRING, description='Research topic', example='Machine Learning'),
                    }
                )
            ),
        ),
        400: openapi.Response(description="Bad Request"),
        401: openapi.Response(description="Unauthorized"),
        500: openapi.Response(description="Internal Server Error")
    },
    security=[{'Token': []}],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def research_interests_options(request):
    try:
        query = request.GET.get('query', '')
        research_interests = ResearchInterestOptions.objects.filter(
            topic__icontains=query)
        serializer = ResearchInterestOptionsSerializer(
            research_interests, many=True)

        # Construct the success response
        response = {
            'status': 'success',
            'message': gettext_lazy('Request processed successfully.'),
            'data': {
                'research_interests': serializer.data
            }
        }
        return JsonResponse(response, status=status.HTTP_200_OK)
    except Exception as e:
        # Construct the error response
        error_response = {
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the research interests.'),
            'error_code': 'RESEARCH_INTERESTS_FETCH_ERROR',
            'details': str(e)
        }
        return JsonResponse(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@swagger_auto_schema(
    method='get',
    operation_summary="Get Skill Options",
    operation_description="Retrieve a list of skill options filtered by a query string. The query string allows filtering skills by name.",
    manual_parameters=[
        openapi.Parameter(
            'query',
            openapi.IN_QUERY,
            description="Query string to filter skills by name",
            type=openapi.TYPE_STRING,
            examples={
                "example": {"value": "Python"}
            }
        )
    ],
    responses={
        200: openapi.Response(
            description="A list of skill options",
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='ID of the skill', example=1),
                        'skill_name': openapi.Schema(type=openapi.TYPE_STRING, description='Skill name', example='Python'),
                    }
                )
            ),
        ),
        400: openapi.Response(description="Bad Request"),
        401: openapi.Response(description="Unauthorized"),
        500: openapi.Response(description="Internal Server Error")
    },
    security=[{'Token': []}],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def skill_options(request):
    try:
        query = request.GET.get('query', '')
        skills = SkillOptions.objects.filter(
            skill_name__icontains=query)
        serializer = SkillOptionsSerializer(
            skills, many=True)

        # Construct the success response
        response = {
            'status': 'success',
            'message': _('Request processed successfully.'),
            'data': {
                'skills': serializer.data
            }
        }
        return JsonResponse(response, status=status.HTTP_200_OK)
    except Exception as e:
        # Construct the error response
        error_response = {
            'status': 'error',
            'message': _('An error occurred while fetching the skills.'),
            'error_code': 'SKILLS_FETCH_ERROR',
            'details': str(e)
        }
        return JsonResponse(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@swagger_auto_schema(
    method='get',
    operation_summary="Get Country List",
    operation_description="Retrieve a list of all countries with their codes.",
    responses={
        200: openapi.Response(
            description="A list of countries",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'status': openapi.Schema(type=openapi.TYPE_STRING, description='Status of the response', example='success'),
                    'message': openapi.Schema(type=openapi.TYPE_STRING, description='Response message', example='Request processed successfully.'),
                    'data': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'countries': openapi.Schema(
                                type=openapi.TYPE_ARRAY,
                                items=openapi.Schema(
                                    type=openapi.TYPE_OBJECT,
                                    properties={
                                        'code': openapi.Schema(type=openapi.TYPE_STRING, description='Country code', example='US'),
                                        'name': openapi.Schema(type=openapi.TYPE_STRING, description='Country name', example='United States'),
                                    }
                                )
                            )
                        }
                    )
                }
            ),
        ),
        400: openapi.Response(description="Bad Request"),
        401: openapi.Response(description="Unauthorized"),
        500: openapi.Response(description="Internal Server Error")
    },
    security=[{'Token': []}],  # Ensure this matches your authentication setup
)
@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def country_list(request):
    try:
        country_choices = [{'code': code, 'name': name}
                           for code, name in list(countries)]
        response = {
            'status': 'success',
            'message': gettext_lazy('Request processed successfully.'),
            'data': {
                'countries': country_choices
            }
        }
        return JsonResponse(response, status=status.HTTP_200_OK)
    except Exception as e:
        error_response = {
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the country list.'),
            'error_code': 'COUNTRY_LIST_ERROR',
            'details': str(e)
        }
        return JsonResponse(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def state_list(request):
    # Initialize response data using get_response_template
    response_data = get_response_template()
    try:
        # Get and strip the country_code from the request query parameters
        country_code = request.GET.get('country_code', '').strip()

        # Validate country_code length (assuming country_code should be 2 characters long)
        if country_code and len(country_code) != 2:
            raise ValidationError(gettext_lazy(
                'Invalid country code length. Expected 2 characters.'))

        # Filter states based on the country_code if provided, else fetch all states
        if country_code:
            states = State.objects.filter(country_code=country_code)
        else:
            states = State.objects.all()

        # Serialize the state data with only id, name, and country_code
        state_data = serialize('json', states, fields=(
            'id', 'name', 'country_code'))

        # Update response data with success status and state data
        response_data.update({
            'status': 'success',
            'message': gettext_lazy('Request processed successfully.'),
            'data': {
                'states': state_data
            }
        })
        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)
    except ValidationError as ve:
        # Update response data with validation error details
        response_data.update({
            'status': 'error',
            'message': str(ve),
            'error_code': 'INVALID_COUNTRY_CODE'
        })
        return JsonResponse(response_data, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Update response data with general error details
        response_data.update({
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the state list.'),
            'error_code': 'STATE_LIST_ERROR',
            'details': str(e)
        })
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def ethnicity_list(request):
    try:
        # Assuming get_response_template() returns a dictionary
        response_data = get_response_template()
        ethnicity_choices = EthnicityOptions.get_ethnicity_choices()
        ethnicity_data = [{'id': choice[0], 'name': choice[1]}
                          for choice in ethnicity_choices]

        response_data.update({
            'status': 'success',
            'message': gettext_lazy('Ethnicity options fetched successfully.'),
            'data': {
                'ethnicitys': ethnicity_data
            }
        })
        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        response_data.update({
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the state list.'),
            'error_code': 'ETHNICITY_LIST_ERROR',
            'details': str(e)
        })
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def language_list(request):
    # Initialize response data using get_response_template
    response_data = get_response_template()
    try:
        languages = Language.objects.all()

        # Serialize the state data with only id, name, and country_code
        languages_data = serialize('json', languages, fields=(
            'id', 'key', 'properties_name'))

        # Update response data with success status and state data
        response_data.update({
            'status': 'success',
            'message': gettext_lazy('Request processed successfully.'),
            'data': {
                'languages': languages_data
            }
        })
        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)
    except ValidationError as ve:
        # Update response data with validation error details
        response_data.update({
            'status': 'error',
            'message': str(ve),
            'error_code': 'INVALID_LANGUAGE_PROPERTY'
        })
        return JsonResponse(response_data, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Update response data with general error details
        response_data.update({
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the state list.'),
            'error_code': 'LANGUAGE_LIST_ERROR',
            'details': str(e)
        })
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
# Create your views here.

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def countries_list(request):
    if request.method == 'GET':
        if  request.user.has_perm('educational_organizations_app.view_countries'):
            return Response({'message': _('You do not have permission to view countries')},
                            status=status.HTTP_403_FORBIDDEN)
        countries = Countries.objects.filter(deleted_at__isnull=True)
        serializer = CountriesSerializer(countries, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        if  request.user.has_perm('educational_organizations_app.add_countries'):
            return Response({'message': _('You do not have permission to add a country')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = CountriesSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def country_detail(request, pk):
    country = get_object_or_404(Countries, pk=pk, deleted_at__isnull=True)
    if request.method == 'GET':
        if  request.user.has_perm('educational_organizations_app.view_countries'):
            return Response({'message': _('You do not have permission to view this country')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = CountriesSerializer(country)
        return Response(serializer.data)
    elif request.method == 'PUT':
        if  request.user.has_perm('educational_organizations_app.change_countries'):
            return Response({'message': _('You do not have permission to update this country')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = CountriesSerializer(country, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data)
            except IntegrityError as e:
                return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        if request.user.has_perm('educational_organizations_app.delete_countries'):
            return Response({'message': _('You do not have permission to delete this country')},
                            status=status.HTTP_403_FORBIDDEN)
        country.deleted_at = timezone.now()
        country.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def geo_admin1_list(request):
    if request.method == 'GET':
        if request.user.has_perm('educational_organizations_app.view_geoadmin1'):
            return Response({'message': _('You do not have permission to view geo-administrative areas')},
                            status=status.HTTP_403_FORBIDDEN)

        country_id = request.query_params.get('country')
        if country_id:
            geo_admin1 = GeoAdmin1.objects.filter(deleted_at__isnull=True, country_id=country_id)
        else:
            geo_admin1 = GeoAdmin1.objects.filter(deleted_at__isnull=True)

        serializer = GeoAdmin1Serializer(geo_admin1, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if request.user.has_perm('educational_organizations_app.add_geoadmin1'):
            return Response({'message': _('You do not have permission to add geo-administrative areas')},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = GeoAdmin1Serializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def geo_admin1_detail(request, pk):
    geo_admin1 = get_object_or_404(GeoAdmin1, pk=pk, deleted_at__isnull=True)
    if request.method == 'GET':
        if request.user.has_perm('educational_organizations_app.view_geoadmin1'):
            return Response({'message': _('You do not have permission to view this geo-administrative area')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = GeoAdmin1Serializer(geo_admin1)
        return Response(serializer.data)
    elif request.method == 'PUT':
        if request.user.has_perm('educational_organizations_app.change_geoadmin1'):
            return Response({'message': _('You do not have permission to update this geo-administrative area')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = GeoAdmin1Serializer(geo_admin1, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data)
            except IntegrityError as e:
                return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        if request.user.has_perm('educational_organizations_app.delete_geoadmin1'):
            return Response({'message': _('You do not have permission to delete this geo-administrative area')},
                            status=status.HTTP_403_FORBIDDEN)
        geo_admin1.deleted_at = timezone.now()
        geo_admin1.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def geo_admin2_list(request):
    if request.method == 'GET':
        if request.user.has_perm('educational_organizations_app.view_geoadmin2'):
            return Response({'message': _('You do not have permission to view geo-administrative areas level 2')},
                            status=status.HTTP_403_FORBIDDEN)

        country_id = request.query_params.get('country')
        geo_admin_1_id = request.query_params.get('geo_admin_1')
        geo_admin2s = GeoAdmin2.objects.filter(deleted_at__isnull=True)

        if country_id:
            geo_admin2s = geo_admin2s.filter(country_id=country_id)
        if geo_admin_1_id:
            geo_admin2s = geo_admin2s.filter(geo_admin_1_id=geo_admin_1_id)

        serializer = GeoAdmin2Serializer(geo_admin2s, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if request.user.has_perm('educational_organizations_app.add_geoadmin2'):
            return Response({'message': _('You do not have permission to add geo-administrative areas level 2')},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = GeoAdmin2Serializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def geo_admin2_detail(request, pk):
    geo_admin2 = get_object_or_404(GeoAdmin2, pk=pk, deleted_at__isnull=True)
    if request.method == 'GET':
        if request.user.has_perm('educational_organizations_app.view_geoadmin2'):
            return Response({'message': _('You do not have permission to view this geo-administrative area level 2')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = GeoAdmin2Serializer(geo_admin2)
        return Response(serializer.data)
    elif request.method == 'PUT':
        if request.user.has_perm('educational_organizations_app.change_geoadmin2'):
            return Response({'message': _('You do not have permission to update this geo-administrative area level 2')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = GeoAdmin2Serializer(geo_admin2, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data)
            except IntegrityError as e:
                return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        if request.user.has_perm('educational_organizations_app.delete_geoadmin2'):
            return Response({'message': _('You do not have permission to delete this geo-administrative area level 2')},
                            status=status.HTTP_403_FORBIDDEN)
        geo_admin2.deleted_at = timezone.now()
        geo_admin2.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    


class UploadFileView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Upload Resume and SOP",
        operation_description="Allows authenticated users to upload their resume and statement of purpose (SOP) files in PDF format. Files must meet specified criteria for format and size.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['resume', 'sop'],
            properties={
                'resume': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_BINARY, description='Resume file in PDF format.'),
                'sop': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_BINARY, description='Statement of Purpose file in PDF format.'),
            }
        ),
        responses={
            201: openapi.Response(description="Success"),
            400: openapi.Response(description="Bad Request"),
            500: openapi.Response(description="Internal Server Error")
        }
    )
    def post(self, request, format=None):
        resume_data = request.data.get('resume')
        sop_data = request.data.get('sop')
        image = request.data.get('image')
        user = request.user
        
  
        # Validate file types
        if not resume_data and not sop_data and not image:
            return Response({'error': GLOBAL_ERROR_MESSAGES['upload_either']}, status=status.HTTP_400_BAD_REQUEST)

        if resume_data and not resume_data.name.endswith('.pdf'):
            return Response({'error': GLOBAL_ERROR_MESSAGES['pdf_for_resume']}, status=status.HTTP_400_BAD_REQUEST)

        if sop_data and not sop_data.name.endswith('.pdf'):
            return Response({'error': GLOBAL_ERROR_MESSAGES['pdf_for_sop']}, status=status.HTTP_400_BAD_REQUEST)
        
        if image and not image.name.endswith('.png') and not image.name.endswith('.jpg') and not image.name.endswith('.jpeg') and not image.name.endswith('.svg') and not image.name.endswith('.eps') and not image.name.endswith('.gif'):
           return Response({"document": [GLOBAL_ERROR_MESSAGES['jpg_for_image']]}, status=status.HTTP_400_BAD_REQUEST)
    

        # Upload resume file
        if resume_data:
            success, resp = upload_file(
                resume_data, UserDocument.RESUME, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))
            if not success:
                return Response({'error': resp}, status=status.HTTP_404_NOT_FOUND)

        # Upload SOP file
        if sop_data:
            success, resp = upload_file(sop_data, UserDocument.SOP, user, max_size_mb=int(
                os.getenv('MAX_FILE_UPLOAD_SIZE')))
            if not success:
                return Response({'error': resp}, status=status.HTTP_404_NOT_FOUND)
            
        

        if image:
            if image.size > int(os.getenv('MAX_LOGO_SIZE')) * 1024 * 1024:
                return Response({'document': [GLOBAL_ERROR_MESSAGES['image_size_exceed'] % {'max_size': int(os.getenv('MAX_LOGO_SIZE'))}]}, status=status.HTTP_400_BAD_REQUEST)
            
            success, resp = upload_file(image, UserDocument.IMAGE, user, max_size_mb=int(
                os.getenv('MAX_LOGO_SIZE')))
            if not success:
                return Response({'error': resp}, status=status.HTTP_404_NOT_FOUND)

        return Response({'success': GLOBAL_SUCCESS_MESSAGES['upload_success'] , "data" : resp}, status=status.HTTP_201_CREATED)
    def get(self, request, pk=None):
        user = request.user
        try:
            document = Document.objects.get(pk=pk, user=user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        
        
        serializer = DocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request, pk=None):
        user = request.user
        try:
            document = Document.objects.get(pk=pk, user=user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        
        document.delete()
        return Response({'success': 'Document deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    
    def put(self, request, pk=None):
        user = request.user
        try:
            document = Document.objects.get(pk=pk, user=user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

        resume_data = request.data.get('resume')
        sop_data = request.data.get('sop')
        image = request.data.get('image')
        
        # Validate file types
        if not resume_data and not sop_data and not image:
            return Response({'error': GLOBAL_ERROR_MESSAGES['upload_either']}, status=status.HTTP_400_BAD_REQUEST)

        if resume_data and not resume_data.name.endswith('.pdf'):
            return Response({'error': GLOBAL_ERROR_MESSAGES['pdf_for_resume']}, status=status.HTTP_400_BAD_REQUEST)

        if sop_data and not sop_data.name.endswith('.pdf'):
            return Response({'error': GLOBAL_ERROR_MESSAGES['pdf_for_sop']}, status=status.HTTP_400_BAD_REQUEST)
        
        if image is not None and not (image.name.endswith('.png') or image.name.endswith('.jpg') or image.name.endswith('.jpeg')):
            return Response({'error': GLOBAL_ERROR_MESSAGES['jpg_for_image']}, status=status.HTTP_400_BAD_REQUEST)

        # Update resume file
        if resume_data:
            success, resp = edit_file(pk, resume_data, UserDocument.RESUME, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))
            if not success:
                return Response({'error': resp}, status=status.HTTP_404_NOT_FOUND)

        # Update SOP file
        if sop_data:
            success, resp = edit_file(pk, sop_data, UserDocument.SOP, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))
            if not success:
                return Response({'error': resp}, status=status.HTTP_404_NOT_FOUND)
            
        if image:
            success, resp = edit_file(pk, image, UserDocument.IMAGE, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))
            if not success:
                return Response({'error': resp}, status=status.HTTP_404_NOT_FOUND)

        return Response({'success': GLOBAL_SUCCESS_MESSAGES['upload_success'], 'data': resp}, status=status.HTTP_200_OK)
    
      
    
@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def organization_category_list(request):
    response_data = get_response_template()
    try:
        organizational_categories = EducationalOrganizationsCategory.objects.all()
        organizational_categories_data = serialize('json', organizational_categories, fields=(
            'id', 'name'))

        response_data.update({
            'status': 'success',
            'message': gettext_lazy('Request processed successfully.'),
            'data': {
                'organizational_categories': organizational_categories_data
            }
        })
        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)
    except ValidationError as ve:
        response_data.update({
            'status': 'error',
            'message': str(ve),
            'error_code': 'ORGANIZATION_CATEGORY_LIST_ERROR'
        })
        return JsonResponse(response_data, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        response_data.update({
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the organization category list.'),
            'error_code': 'ORGANIZATION_CATEGORY_LIST_ERROR',
            'details': str(e)
        })
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
@api_view(['GET'])
def title_list(request):
    try:
        # Assuming get_response_template() returns a dictionary
        response_data = get_response_template()
        title_options = TitleOptions.get_title_options()
        title_data = [{'id': title[0], 'name': title[1]}
                          for title in title_options]

        response_data.update({
            'status': 'success',
            'message': gettext_lazy('Title options fetched successfully.'),
            'data': {
                'titles': title_data
            }
        })
        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        response_data.update({
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the state list.'),
            'error_code': 'ETHNICITY_LIST_ERROR',
            'details': str(e)
        })
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class BulkUploadView(APIView):
    permission_classes = [IsAuthenticated]
    expected_columns ={'educational_organizations_app': ['name', 'under_category', 'web_address', 'statement', 'status', 'address_line1', 'address_line2', 'city', 'state_province', 'postal_code', 'country_code'],
                        'campus_app':['campus_name','educational_organization','city','address_line1','address_line2','state_province','postal_code','country_code','statement','status'],
                        'college_app' :['name','campus','web_address','city','address_line1','address_line2','state_province','postal_code','country_code','statement','status'],
                        'department_app' :['name','college','web_address','city','address_line1','address_line2','state_province','postal_code','country_code','statement','status']
                       }
    max_row_limit = int(os.getenv('BULK_FILE_MAX_ROW_LIMIT', 20)) 

    @transaction.atomic
    def post(self, request):
        file = request.FILES.get('file')
        data = extract_data_file(file)
        target_app = request.POST.get('type')
        preview = request.POST.get('preview')
        print(target_app)
        if isinstance(data, Response): 
            return data

        validation_error = self.validate_data(data,target_app)
        if validation_error:
            return Response({"error": validation_error}, status=status.HTTP_400_BAD_REQUEST)
        if preview == 'true':
            return Response(data, status=status.HTTP_200_OK)
        document_files = request.FILES.getlist('document_file')
        document_mapping = {file.name: file for file in document_files}
        uploaded_file_paths = []

        try:
            self.save_data(data, target_app, request, document_mapping, uploaded_file_paths)
            return Response({"message": _("Data uploaded successfully")}, status=status.HTTP_200_OK)
        except ValidationError as e:
            delete_uploaded_files(uploaded_file_paths)
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            delete_uploaded_files(uploaded_file_paths)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def save_data(self, data, target_app, request, document_mapping, uploaded_file_paths):
        serializer_class = get_serializer_class(target_app)
        user = request.user
        for row in data:
            document_filename = row.get('logo_file', None)
            if document_filename and document_filename in document_mapping:
                document_file = document_mapping.get(document_filename,None)
                
                file_upload_success, file_upload_error, file_path = upload_file(
                    data=document_file, use=UserDocument.ORG_LOGO, user=user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')), return_file_path=True)
                if not file_upload_success:
                    raise ValidationError(file_upload_error)

                uploaded_file_paths.append(file_path)
                upload_file_id = UserDocument.objects.filter(
                    user=user, use=UserDocument.ORG_LOGO
                ).latest('created_at').document.id
                row['document'] = upload_file_id
            elif not document_filename in document_mapping and document_filename:
                raise ValidationError(_("%(document_filename)s of Logo file not found")%{'document_filename':document_filename})
            serializer = serializer_class(data=row, context={'request': request})
            if serializer.is_valid():
                serializer.save()
            else:
                raise ValidationError(serializer.errors)

    def validate_data(self, data,target_app):
        actual_columns = data[0].keys()
        if not set(self.expected_columns[target_app]).issubset(set(actual_columns)):
            return _("Invalid columns. Expected columns are %(expected_columns)s. Also optionally 'logo_file' for logo name.") % {
                'expected_columns': self.expected_columns[target_app]
                }
        if len(data) > self.max_row_limit:
            return _("Row count exceeds the limit of %(max_row_limit)s.") % {
            'max_row_limit': self.max_row_limit
            }

        serializer_class = get_serializer_class(target_app)
        for index, row in enumerate(data, start=1):
            serializer = serializer_class(data=row)
            if not serializer.is_valid():
                error_messages = []
                for field, errors in serializer.errors.items():
                    for error in errors:
                        error_messages.append(f"{field}: {str(error)}")
                error_message_str = ", ".join(error_messages)
                return _("Error in row %(index)s: %(error_message_str)s") % {
                    'index': index,
                    'error_message_str': error_message_str
                }
        return None

from django.core.files.base import ContentFile
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def clone_data(request):
    cloned_data= request.data.copy()
    target_app = cloned_data.get('type')
    serializer_class = get_serializer_class(target_app)
    model_class = get_model_class(target_app)
    try:
        document_file= request.FILES.get("document_file",None)
        if target_app == 'educational_organizations_app':
            if not document_file:
                logo_id = cloned_data['document']
                document = Document.objects.get(id=logo_id)
                if document:
                    document_file_path = os.path.join(settings.MEDIA_ROOT, document.file_name_system)
                    with open(document_file_path, 'rb') as f:
                        file_content = f.read()
                    document_file = ContentFile(file_content, name=document.file_name_system)
            user=request.user
            file_upload_success, file_upload_error = upload_file(
                document_file, UserDocument.ORG_LOGO, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE'))
            )
            if not file_upload_success:
                return Response({'error': file_upload_error}, status=status.HTTP_400_BAD_REQUEST)
            upload_file_id = UserDocument.objects.filter(
                user=user, use=UserDocument.ORG_LOGO
            ).latest('created_at').document.id
            cloned_data['document'] = upload_file_id

        serializer = serializer_class(data=cloned_data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            serializer_instance_data = serializer.data.copy()
            serializer_instance_data['logo_url'] = default_storage.url(serializer_instance_data['document_name'])
            return Response({"status": 'success', "data": serializer_instance_data,"message":_("Record Clone Successfully")}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except model_class.DoesNotExist:
        return Response({"error": gettext_lazy("Not Found")}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def organization_details(request, slug):
    try:
        organization = EducationalOrganizations.get_by_slug(slug)
        organization_data = EducationalOrganizationsSerializer(organization).data
        organization_data['logo_url'] = default_storage.url(organization_data['document_name']) if organization_data['document_name'] else None
        number_of_students = organization.userdetails_set.count() 
        
        funding_for_org = Funding.objects.filter(funding_for_edu_org=organization)
        funding_data= FundingSerializer(funding_for_org, many=True).data

        funding_for_colleges = Funding.objects.filter(
            funding_for_college__campus__educational_organization=organization
        )
        funding_data+= FundingSerializer(funding_for_colleges, many=True).data
        funding_for_departments = Funding.objects.filter(
            funding_for_dept__college__campus__educational_organization=organization
        )
        funding_data+= FundingSerializer(funding_for_departments, many=True).data

        total_funding_org = funding_for_org.aggregate(total=Sum('amount'))['total'] or 0
        total_funding_colleges = funding_for_colleges.aggregate(total=Sum('amount'))['total'] or 0
        total_funding_departments = funding_for_departments.aggregate(total=Sum('amount'))['total'] or 0
        total_funding = total_funding_org + total_funding_colleges + total_funding_departments

        total_positions_org = funding_for_org.aggregate(total_positions=Sum('number_of_positions_opening'))['total_positions'] or 0
        total_positions_colleges = funding_for_colleges.aggregate(total_positions=Sum('number_of_positions_opening'))['total_positions'] or 0
        total_positions_departments = funding_for_departments.aggregate(total_positions=Sum('number_of_positions_opening'))['total_positions'] or 0
        total_positions = total_positions_org + total_positions_colleges  + total_positions_departments
            
        faculty_members = FacultyMembers.objects.filter(educational_organization=organization)
        faculty_data = FacultyMembersSerializer(faculty_members, many=True).data
        
        campuses = Campus.objects.filter(educational_organization=organization)
        campus_data = CampusSerializer(campuses, many=True).data
        # for campus in campus_data:
        #     print("campus_data ", campus['campus_name'])

        departments = Department.objects.filter(college__campus__educational_organization=organization)
        department_data = DepartmentSerializer(departments, many=True).data
        colleges = College.objects.filter(campus__in=campuses)
        college_data = CollegeSerializer(colleges, many=True).data
        
        response_data = {
            'organization': organization_data,
            'number_of_students': number_of_students,
            'total_funding': total_funding,
            'funding_data': funding_data,
            'total_faculty': faculty_members.count(),
            'faculty_data': faculty_data,
            'colleges': college_data,
            'campuses': campus_data,
            'departments': department_data,
            'total_scholarship': total_positions
        }
        
        return JsonResponse(response_data, status=status.HTTP_200_OK)
    
    except EducationalOrganizations.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': _('Organization not found.'),
            'error_code': 'ORGANIZATION_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        print(e)
        error_response = {
            'status': 'error',
            'message': _('An error occurred while fetching the organization details.'),
            'error_code': 'ORGANIZATION_ERROR',
            'details': str(e)
        }
        return JsonResponse(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
@api_view(['POST'])
def organization_details_post(request):
    
    status_code = status.HTTP_200_OK
    response_data = get_response_template()
    organization_data = request.data  # Ensure request.data is used
    
    g_reCaptcha_token = request.data.get('recaptcha_token')

    if not g_reCaptcha_token:
        response_data.update({
            'status': 'error',
            'message': gettext_lazy(GLOBAL_ERROR_MESSAGES['missing_recaptcha_token']),
            'error_code': 'VALIDATION_ERROR',
            'details': None
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify reCAPTCHA
    recaptcha_data = {
        'response': g_reCaptcha_token,
        'secret': os.getenv('RECAPTCHA_SECRET_KEY')
    }
    recaptcha_response = requests.post(
        os.getenv('RECAPTCHA_SITE_VERIFICATION_URL'), data=recaptcha_data)
    recaptcha_result = recaptcha_response.json()

    if not recaptcha_result.get('success') or recaptcha_result.get('score', 0) < float(os.getenv('RECAPTCHA_SITE_SCORE')):
        response_data.update({
            'status': 'error',
            'message': gettext_lazy(GLOBAL_ERROR_MESSAGES['failed_recaptcha_verification']),
            'error_code': 'VALIDATION_ERROR',
            'details': None
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        document_file = request.data.get('document_file', None)
        if 'document_file' in request.FILES and request.FILES['document_file'] is not None:
            content_type = document_file.content_type
            if not content_type.startswith('image/'):
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Only JPG, PNG, GIF image files are allowed.'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': None
                })
                return Response(response_data, status=status_code)

        serializer_instance = EducationalOrganizationsSerializer(data=organization_data, context={'request': request})
        if serializer_instance.is_valid():
            
            if 'document_file' in request.FILES and request.FILES['document_file'] is not None:
                user = self.request.user
                file_upload_success, file_upload_error = upload_file(
                    document_file, UserDocument.ORG_LOGO, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))

                if not file_upload_success:
                    log_request_error("POST", "[Organization Create] file upload failed", request)
                    status_code = status.HTTP_400_BAD_REQUEST
                    response_data.update({
                        'status': 'error',
                        'message': gettext_lazy('File upload failed.'),
                        'error_code': 'VALIDATION_ERROR',
                        'details': None
                    })
                    return Response(response_data, status=status_code)

                # Assuming upload_file_id retrieval logic is correct
                upload_file_id = UserDocument.objects.filter(user=user, use=UserDocument.ORG_LOGO).latest(
                    'created_at').document.id
                organization_data['document'] = upload_file_id

                serializer_instance = EducationalOrganizationsSerializer(data=organization_data, context={'request': request})

                if serializer_instance.is_valid():
                    serializer_instance.save()

                serializer_instance_data = serializer_instance.data
                logo_url = default_storage.url(serializer_instance_data['document_name'])
                serializer_instance_data['logo_url'] = logo_url

            else:
                serializer_instance.save()  # Save the serializer without file upload
                serializer_instance_data = serializer_instance.data
                
            
            emails.send_welcome_organization_email(serializer_instance_data)

            response_data.update({
                'status': 'success',
                'data': serializer_instance_data,
                'message': GLOBAL_SUCCESS_MESSAGES['org_registration_success'],
            })
        else:
            status_code = status.HTTP_400_BAD_REQUEST
            response_data.update({
                'status': 'error',
                'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                'error_code': 'VALIDATION_ERROR',
                'details': serializer_instance.errors
            })

    except ValidationError as e:
        log_request_error("POST", "[Organization Create] {e}", request)
        response_data.update({
            'status': 'error',
            'message': gettext_lazy("Validation error occurred."),
            'error_code': 'VALIDATION_ERROR',
            'details': e.detail
        })
        status_code = status.HTTP_400_BAD_REQUEST

    return Response(response_data, status=status_code)


from django.contrib.auth.models import User
from django.db.models.functions import TruncMonth,TruncYear
from calendar import month_name
from datetime import datetime
from django.db import IntegrityError, transaction
from calendar import month_name, monthrange
from django.db.models import Count, Case, When, IntegerField, Q
from django.db.models.functions import TruncMonth, TruncDay, TruncYear

@api_view(['GET'])
def get_static_data(request):
    limit=5
    current_year = datetime.now().year
    active_user_data = (
        User.objects.filter(is_active=True, date_joined__year=current_year)
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    month_counts = {item['month'].strftime('%B'): item['count'] for item in active_user_data}
    active_user_data = [month_counts.get(month, 0) for month in month_name[1:]]
    total_active_users = User.objects.filter(is_active=True).count()
    total_users = User.objects.count()
    recent_active_user = User.objects.filter(is_active=True).order_by('-date_joined')[:limit]
    recent_active_user_serialized=UserSerializer(recent_active_user,many =True).data
    
    
    reg_data= User.objects.all()
    recent_reg_count = reg_data.count()
    recent_reg_model_data = (
        reg_data.filter(date_joined__year=current_year)
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
    )
    month_counts = {item['month'].strftime('%B'): item['count'] for item in recent_reg_model_data}
    recent_reg_data = [month_counts.get(month, 0) for month in month_name[1:]]
    recent_reg_list= reg_data.order_by('-date_joined')[:5]
    recent_reg_list_serialized=UserSerializer(recent_reg_list,many =True).data

    institute_data=EducationalOrganizations.objects.filter(deleted_at__isnull=True)
    current_institution_count = institute_data.count()
    active_institution_data = (
        institute_data.filter( created_at__year=current_year)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    month_counts = {item['month'].strftime('%B'): item['count'] for item in active_institution_data}
    active_institution_data = [month_counts.get(month, 0) for month in month_name[1:]]
    university_count=institute_data.filter(under_category__name__icontains="university").count()
    school_count=institute_data.filter(under_category__name__icontains="school").count()
    faculty_count = (
        institute_data
        .annotate(faculty_count=Count('facultymembers'))
        .values('id', 'name', 'faculty_count')
    ).count()
    recent_institutions = institute_data.order_by('-created_at')[:limit]
    recent_institutions_serialized = EducationalOrganizationsSerializer(recent_institutions, many=True).data
    

    campus_data=Campus.objects.filter(deleted_at__isnull=True)
    current_campus_count = campus_data.count()
    active_campus_data = (
        Campus.objects.filter(deleted_at__isnull=True, created_at__year=current_year)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    month_counts = {item['month'].strftime('%B'): item['count'] for item in active_campus_data}
    active_campus_data = [month_counts.get(month, 0) for month in month_name[1:]]
    recent_campuses = campus_data.order_by('-created_at')[:limit]
    recent_campuses_serialized = CampusSerializer(recent_campuses, many=True).data

    college_data=College.objects.filter(deleted_at__isnull=True)
    current_college_count = college_data.count()
    active_college_data = (
        college_data.filter(created_at__year=current_year)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    month_counts = {item['month'].strftime('%B'): item['count'] for item in active_college_data}
    active_college_data = [month_counts.get(month, 0) for month in month_name[1:]]
    recent_colleges =college_data.order_by('-created_at')[:limit]
    recent_colleges_serialized = CollegeSerializer(recent_colleges, many=True).data

    department_data=Department.objects.filter(deleted_at__isnull=True)
    current_department_count = department_data.count()
    active_department_data = (
        department_data.filter( created_at__year=current_year)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    month_counts = {item['month'].strftime('%B'): item['count'] for item in active_department_data}
    active_department_data = [month_counts.get(month, 0) for month in month_name[1:]]
    recent_departments = department_data.order_by('-created_at')[:limit]
    recent_departments_serialized = DepartmentSerializer(recent_departments, many=True).data

    member_data=FacultyMembers.objects.filter(deleted_at__isnull=True)
    current_member_count = member_data.count()
    active_member_data = (
        member_data.filter(created_at__year=current_year)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    month_counts = {item['month'].strftime('%B'): item['count'] for item in active_member_data}
    active_member_data = [month_counts.get(month, 0) for month in month_name[1:]]
    recent_members = member_data.order_by('-created_at')[:limit]
    recent_members_serialized = FacultyMembersSerializer(recent_members, many=True).data

    response = {
        "active_user_data": list(active_user_data),
        "total_active_users": total_active_users,
        "total_users": total_users,
        "recent_active_user":recent_active_user_serialized,

        "recent_reg_data":recent_reg_data,
        "recent_reg_count":recent_reg_count,
        "recent_reg_list": recent_reg_list_serialized,

        "current_institution_count": current_institution_count,
        "active_institution_data": active_institution_data,
        "recent_institutions": recent_institutions_serialized,

        "active_campus_data": active_campus_data,
        "current_campus_count": current_campus_count,
        "recent_campuses": recent_campuses_serialized,

        "current_department_count": current_department_count,
        "active_department_data": active_department_data,
        "recent_departments": recent_departments_serialized,

        "current_college_count": current_college_count,
        "active_college_data": active_college_data,
        "recent_colleges": recent_colleges_serialized,

        "current_member_count": current_member_count,
        "active_member_data": active_member_data,
        "recent_members": recent_members_serialized,

        "university_count":university_count,
        "school_count":school_count,
        "faculty_count":faculty_count
    }
    return Response(response)


@api_view(['POST'])
def get_chart_data(request):
    target_app = request.data.get('category')
    query_type = request.data.get("type")
    limit = int(request.data.get("limit",10))
    response_data = {}
    serializer=get_serializer_class(target_app)
    model = get_model_class(target_app)

    if query_type == 'Monthly':
        year = request.data.get('year',datetime.now().year)
        if not year:
            year = datetime.now().year
            
        if not year:
            return Response({"error":_("Year parameter is required for Monthly query")}, status=400)

        if 'educational_organizations' in target_app:
            model_data = (
                model.objects.filter(created_at__year=year)
                .annotate(month=TruncMonth('created_at'))
                .order_by('month')
            )
            
            faculty_model_data = (
                FacultyMembers.objects.filter(educational_organization__created_at__year=year)
                .annotate(month=TruncMonth('educational_organization__created_at'))
                .order_by('month')
            )
            faculty_data_serialized=FacultyMembersSerializer(faculty_model_data,many= True).data
            faculty_data=(faculty_model_data
                .values('month')
                .annotate(faculty_count=Count('id'))
                .order_by('month')
            )
            faculty_month_counts = {item['month'].strftime('%B'): item['faculty_count'] for item in faculty_data}
    
            month_counts_list=model_data.values('month').annotate(
                    school_count=Count(Case(
                        When(under_category__name__icontains="school", then=1),
                        When(under_category__name__icontains="college", then=1),
                        output_field=IntegerField()
                    )),
                    university_count=Count(Case(
                        When(under_category__name__icontains='university', then=1),
                        output_field=IntegerField()
                    ))
                )
            month_counts = {item['month'].strftime('%B'): item for item in month_counts_list}
            
            university_data= model_data.filter(under_category__name__icontains="university")
            university_data_serialized=serializer(university_data.order_by('month')[:limit], many=True).data

            school_data= model_data.filter(    
                Q(under_category__name__icontains="school") | 
                Q(under_category__name__icontains="college"))
            school_data_serialized=serializer(school_data.order_by('month')[:limit], many=True).data

            filtered_school_data = [month_counts.get(month, {}).get('school_count', 0) for month in month_name[1:]]
            filtered_university_data = [month_counts.get(month, {}).get('university_count', 0) for month in month_name[1:]]
            filtered_faculty_data = [faculty_month_counts.get(month, 0) for month in month_name[1:]]

            response_data = {
                "schools": filtered_school_data,
                "universities": filtered_university_data,
                "faculties": filtered_faculty_data,
                "university_data_list": university_data_serialized,
                "school_data_list": school_data_serialized,
                "faculty_data_list": faculty_data_serialized,
            }
     
        elif 'user' in target_app:
            model_data = (User.objects.filter(date_joined__year=year)
                          .annotate(month=TruncMonth('date_joined')))

            month_user_data=(model_data
                            .values('month')
                            .annotate(
                                active=Count(Case(
                                    When(is_active=True, then=1),
                                    output_field=IntegerField())),
                                inactive=Count(Case(
                                    When(is_active=False, then=1),
                                    output_field=IntegerField()))
                                )
                            .order_by('month'))
            user_data_serialized = serializer(model_data[:limit], many=True).data
            model_data_active=sum([item['active'] for item in month_user_data.filter(is_active=True)])
            model_data_inactive=sum([item['inactive'] for item in month_user_data])
            month_counts = {item['month'].strftime('%B'): [item['active'],item['inactive']] for item in month_user_data}

            month_range_data = [month_counts.get(month,[0,0]) for month in month_name[1:]]
            response_data.update({f'{target_app}_month_range': month_range_data,
                                  f'{target_app}_month_range_active': model_data_active,
                                  f'{target_app}_month_range_inactive': model_data_inactive,
                                  f'{target_app}_month_range_info_list': user_data_serialized,
                                  })

        else:
            model_data = (
                model.objects.filter(created_at__year=year)
                .annotate(month=TruncMonth('created_at'))
                .order_by('month')
            )
            
            month_counts = (
                model_data.values('month')
                .annotate(count=Count('id')) 
                .order_by('month')
            )

            month_counts_dict = {item['month'].strftime('%B'): item['count'] for item in month_counts}

            model_list_data = [month_counts_dict.get(month, 0) for month in month_name[1:]]

            model_info_data = serializer(model_data, many=True).data

            response_data.update({
                f'{target_app}_month_range': model_list_data,
                f'{target_app}_month_range_info_list': model_info_data,  
            })

    elif query_type == 'Yearly':
        start_year = request.data.get('start_year',datetime.now().year)
        end_year = request.data.get('end_year',datetime.now().year-1)

        if 'educational_organizations' in target_app:
            model_data = (
                model.objects.filter(created_at__year__range=[start_year, end_year])
                .annotate(year=TruncYear('created_at'))
                .order_by('year'))

            university_data= model_data.filter(under_category__name__icontains="university")
            university_data_serialized=serializer(university_data.order_by('year')[:limit], many=True).data

            school_data= model_data.filter(    
                Q(under_category__name__icontains="school") | 
                Q(under_category__name__icontains="college"))
            school_data_serialized=serializer(school_data.order_by('year')[:limit], many=True).data

            yearly_model_data=(model_data.values('year')
                .annotate(
                    school_count=Count(Case(
                        When(under_category__name__icontains="school", then=1),
                        When(under_category__name__icontains="college", then=1),
                        output_field=IntegerField()
                    )),
                    university_count=Count(Case(
                        When(under_category__name__icontains='university', then=1),
                        output_field=IntegerField()
                    ))
                )
                .order_by('year'))

            faculty_model_data = (
                FacultyMembers.objects.filter(created_at__year__range=[start_year, end_year])
                .annotate(year=TruncYear('created_at'))
                .order_by('year')
            )
            faculty_data = (faculty_model_data
                .values('year')
                .annotate(faculty_count=Count('id'))
                .order_by('year')
            )
            faculty_data_serialized=FacultyMembersSerializer(faculty_model_data,many= True).data

            year_counts = {item['year'].year: item for item in yearly_model_data}
            faculty_year_counts = {item['year'].year: item['faculty_count'] for item in faculty_data}

            filtered_school_data = [year_counts.get(year, {}).get('school_count', 0) for year in range(int(start_year), int(end_year) + 1)]
            filtered_university_data = [year_counts.get(year, {}).get('university_count', 0) for year in range(int(start_year), int(end_year) + 1)]
            filtered_faculty_data = [faculty_year_counts.get(year, 0) for year in range(int(start_year), int(end_year) + 1)]

            response_data = {
                "schools_year_range": filtered_school_data,
                "universities_year_range": filtered_university_data,
                "faculties_year_range": filtered_faculty_data,
                "university_data_list": university_data_serialized,
                "school_data_list": school_data_serialized,
                "faculty_data_list": faculty_data_serialized,
            }

        elif 'user' in target_app:
            year_data = (
                model.objects.filter(date_joined__year__range=[start_year, end_year])
                .annotate(year=TruncYear('date_joined'))
                .order_by('year')
            )
            year_model_data=(
                year_data.annotate(                
                    active=Count(Case(
                        When(is_active=True, then=1),
                        output_field=IntegerField()
                        )),
                    inactive=Count(Case(When(is_active=False,then=1),output_field=IntegerField()))
                    )
                .values('year','active','inactive')
                .annotate(count=Count('id'))
                .order_by('year')
            )
            model_data_serialized=serializer(year_data,many=True).data
            
            model_data_active=sum([item['active'] for item in year_model_data.filter(is_active=True)])
            model_data_inactive=sum([item['inactive'] for item in year_model_data.filter(is_active=False)])

            year_counts = {item['year'].year:  [item['active'],item['inactive']] for item in year_model_data}
            year_range_data = [year_counts.get(year,[0,0]) for year in range(int(start_year), int(end_year) + 1)]
            
            response_data.update({f'{target_app}_year_range': year_range_data,
                                    f'{target_app}_year_range_active': model_data_active,
                                    f'{target_app}_year_range_inactive': model_data_inactive,
                                    f'{target_app}_year_range_inactive': model_data_inactive,
                                    f'{target_app}_month_range_info_list':model_data_serialized
                                  })

        else:
            year_data = (
                model.objects.filter(created_at__year__range=[start_year, end_year])
                .annotate(year=TruncYear('created_at')))
            model_info_data=serializer(year_data,many=True).data
            year_model_data=(year_data
                .values('year')
                .annotate(count=Count('id'))
                .order_by('year')
            )
            year_counts = {item['year'].year: item['count'] for item in year_model_data}
            year_range_data = [year_counts.get(year, 0) for year in range(int(start_year), int(end_year) + 1)]
            
            response_data.update({
                f'{target_app}_year_range': year_range_data,
                f'{target_app}_month_range_info_list': model_info_data, 
                })

    elif query_type == 'Everyday':
        year = request.data.get('year',datetime.now().year)
        month = request.data.get('month',datetime.now().month)
        
        if year is None and month is None:
            raise ValidationError(_("year and month is required for Daily data"))
        if 'educational_organizations' in target_app:
            model_data = (
                model.objects.filter(created_at__year=year, created_at__month=month)
                .annotate(day=TruncDay('created_at'))
                .order_by('day')
            )
            university_data= model_data.filter(under_category__name__icontains="university")
            university_data_serialized=serializer(university_data.order_by('day')[:limit], many=True).data

            school_data= model_data.filter(    
                Q(under_category__name__icontains="school") | 
                Q(under_category__name__icontains="college"))
            school_data_serialized=serializer(school_data.order_by('day')[:limit], many=True).data

            daily_model_data=(model_data
                .values('day')
                .annotate(
                    school_count=Count(Case(
                        When(under_category__name__icontains="school", then=1),
                        When(under_category__name__icontains="college", then=1),
                        output_field=IntegerField()
                    )),
                    university_count=Count(Case(
                        When(under_category__name__icontains='university', then=1),
                        output_field=IntegerField()
                    ))
                )
                .order_by('day')
            )

            faculty_model_data = (
                FacultyMembers.objects.filter(educational_organization__created_at__year=year, educational_organization__created_at__month=month)
                .annotate(day=TruncDay('educational_organization__created_at'))
                .order_by('day')
            )
            faculty_data_serialized=FacultyMembersSerializer(faculty_model_data,many= True).data
            faculty_data=(faculty_model_data
                .values('day')
                .annotate(faculty_count=Count('id'))
                .order_by('day')
            )

            _, num_days = monthrange(int(year), int(month))
            day_counts = {item['day'].day: item for item in daily_model_data}
            faculty_day_counts = {item['day'].day: item['faculty_count'] for item in faculty_data}

            filtered_school_data = [day_counts.get(day, {}).get('school_count', 0) for day in range(1, num_days + 1)]
            filtered_university_data = [day_counts.get(day, {}).get('university_count', 0) for day in range(1, num_days + 1)]
            filtered_faculty_data = [faculty_day_counts.get(day, 0) for day in range(1, num_days + 1)]

            response_data = {
                "schools_daily": filtered_school_data,
                "universities_daily": filtered_university_data,
                "faculties_daily": filtered_faculty_data,
                "university_data_list": university_data_serialized,
                "school_data_list": school_data_serialized,
                "faculty_data_list": faculty_data_serialized,
            }

        elif 'user' in target_app:
            day_model_data = (
                User.objects.filter(date_joined__year=year, date_joined__month=month)
                .annotate(day=TruncDay('date_joined'))
            )
            model_data_serialized=serializer(day_model_data,many=True).data
            day_data=(day_model_data.annotate(
                    active=Count(Case(
                        When(is_active=True, then=1),
                        output_field=IntegerField()
                        )),
                    inactive=Count(Case(When(is_active=False,then=1),output_field=IntegerField()))
                    )
                .values('day','active','inactive')
                .annotate(count=Count('id'))
                .order_by('day')
            )
            model_data_active=sum([item['active'] for item in day_data.filter(is_active=True)])
            model_data_inactive=sum([item['inactive'] for item in day_data.filter(is_active=False)])

            _, num_days = monthrange(int(year), int(month))
            day_counts = {item['day'].day: [item['active'],item['inactive']] for item in day_data}
            day_range_data = [day_counts.get(day, [0,0]) for day in range(1, num_days + 1)]
            
            response_data.update({f'{target_app}_daily': day_range_data,
                                   f'{target_app}_daily_range_active': model_data_active,
                                  f'{target_app}_daily_range_inactive': model_data_inactive,
                                    f'{target_app}_month_range_info_list': model_data_serialized, 
                                })

        else:
            day_model_data = (
                model.objects.filter(created_at__year=year, created_at__month=month)
                .annotate(day=TruncDay('created_at'))
                .order_by('day')
            )
            model_data_serialized=serializer(day_model_data,many=True).data
            day_data=(day_model_data
                .values('day')
                .annotate(count=Count('id'))
                .order_by('day'))
            
            _, num_days = monthrange(int(year), int(month))
            day_counts = {item['day'].day: item['count'] for item in day_data}
            day_range_data = [day_counts.get(day, 0) for day in range(1, num_days + 1)]
            response_data.update({
                f'{target_app}_daily': day_range_data,
                f'{target_app}_month_range_info_list': model_data_serialized, 
            })
            
    else : raise ValidationError(_("Unsupported type of timeframe"))
    
    return Response(response_data)
    


# Log files mapping
log_files = {
    'critical': 'critical.log',
    'debug': 'debug.log',
    'error': 'error.log',
    'info': 'info.log',
    'warning': 'warning.log'
}

# Regular expression to match log patterns
log_pattern = re.compile(r"(\w+) (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (.*)")

# Function to parse logs from files
def parse_logs():
    log_data = []
    for log_type, filename in log_files.items():
        file_path = os.path.join(settings.LOGS_ROOT, filename)
        try:
            with open(file_path, 'r') as file:
                for line in file:
                    match = log_pattern.search(line)
                    if match:
                        log_level, timestamp_str, message = match.groups()
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
                        log_data.append({'timestamp': timestamp, 'type': log_type, 'message': message})
        except FileNotFoundError:
            # Log that a file was not found, but continue processing others
            log_data.append({'type': log_type, 'error': f'{filename} not found.'})
        except Exception as e:
            # Log any other exceptions that might occur during file reading
            log_data.append({'type': log_type, 'error': str(e)})

    if log_data:
        df = pd.DataFrame(log_data)
        df = df.sort_values(by='timestamp', ascending=False)  # Sort logs by timestamp, recent first
        return df
    else:
        return pd.DataFrame()  # Return an empty DataFrame if no data was collected


# Function to get server health metrics
def get_server_health():
    try:
        return {
            'CPU Usage': psutil.cpu_percent(interval=1),
            'Memory Usage': psutil.virtual_memory().percent,
            'Disk Usage': psutil.disk_usage('/').percent
        }
    except Exception as e:
        return {'error': f"Failed to retrieve server health: {str(e)}"}

# View to return server health information
def server_health(request):
    timeframe = request.GET.get('timeframe', 'Daily')
    period = request.GET.get('period', '2024-08')
    print(timeframe, period)
    try:
        health = get_server_health()
        if 'error' in health:
            return JsonResponse({'status': 'Error', 'details': health}, status=500)

        status = "Healthy"
        if health['CPU Usage'] > 80 or health['Memory Usage'] > 80 or health['Disk Usage'] > 90:
            status = "Critical"

        # Parse logs and filter based on timeframe and period
        df_logs = parse_logs()
        if df_logs.empty:
            chart_data = []
            recent_logs = []
        else:
            df_filtered = filter_logs(df_logs, timeframe, period)
            chart_data = []

            if timeframe == 'Daily':
                days_in_month = pd.Period(period + '-01').days_in_month
                for day in range(1, days_in_month + 1):
                    day_logs = df_filtered[(df_filtered['timestamp'].dt.month == int(period.split('-')[1])) &
                                        (df_filtered['timestamp'].dt.day == day)]
                    chart_data.append({
                        'everyday': str(day),
                        'Critical': day_logs[day_logs['type'] == 'critical'].shape[0],
                        'Warning': day_logs[day_logs['type'] == 'warning'].shape[0],
                        'Info': day_logs[day_logs['type'] == 'info'].shape[0],
                        'Debug': day_logs[day_logs['type'] == 'debug'].shape[0]
                    })

                # Ensure all days from 1 to 31 are represented
                all_days = {str(day): {'Critical': 0, 'Warning': 0, 'Info': 0, 'Debug': 0} for day in range(1, 32)}
                for entry in chart_data:
                    all_days[entry['everyday']].update(entry)
                
                chart_data = [{'everyday': day, **logs} for day, logs in all_days.items()]

            elif timeframe == 'Monthly':
                for month in range(1, 13):
                    month_logs = df_filtered[(df_filtered['timestamp'].dt.year == int(period)) &
                                             (df_filtered['timestamp'].dt.month == month)]
                    chart_data.append({
                        'month': pd.to_datetime(f"{period}-{month:02d}").strftime("%b"),
                        'Critical': month_logs[month_logs['type'] == 'critical'].shape[0],
                        'Warning': month_logs[month_logs['type'] == 'warning'].shape[0],
                        'Info': month_logs[month_logs['type'] == 'info'].shape[0],
                        'Debug': month_logs[month_logs['type'] == 'debug'].shape[0]
                    })
            elif timeframe == 'Yearly':
                start_year, end_year = map(int, period.split('-'))
                for year in range(start_year, end_year + 1):
                    year_logs = df_filtered[df_filtered['timestamp'].dt.year == year]
                    chart_data.append({
                        'year': str(year),
                        'Critical': year_logs[year_logs['type'] == 'critical'].shape[0],
                        'Warning': year_logs[year_logs['type'] == 'warning'].shape[0],
                        'Info': year_logs[year_logs['type'] == 'info'].shape[0],
                        'Debug': year_logs[year_logs['type'] == 'debug'].shape[0]
                    })

            # Get the 5 most recent critical, info, warning, and debug logs (excluding error)
            recent_logs = df_filtered[df_filtered['type'].isin(['critical', 'info', 'warning', 'debug'])] \
                .sort_values(by='timestamp', ascending=False) \
                .groupby('type').head(5) \
                .to_dict(orient='records')

        return JsonResponse({
            'status': status,
            'details': health,
            'chart_data': chart_data,
            'recent_logs': recent_logs
        })

    except Exception as e:
        return JsonResponse({'error': f"An unexpected error occurred: {str(e)}"}, status=500)

# Function to filter logs based on timeframe and period
def filter_logs(df, timeframe, period):
    try:
        if timeframe == 'Daily':
            df = df[df['timestamp'].dt.to_period('M') == period]  # 'YYYY-MM'
        elif timeframe == 'Monthly':
            df = df[df['timestamp'].dt.to_period('Y') == period]  # 'YYYY'
        elif timeframe == 'Yearly':
            start_year, end_year = map(int, period.split('-'))
            df = df[(df['timestamp'].dt.year >= start_year) & (df['timestamp'].dt.year <= end_year)]

        df = df.sort_values(by='timestamp', ascending=False)  # Sort logs by timestamp, recent first
        # Keep only the top 5 recent logs for each log type
        # df = df.groupby('type').head(5)
        return df
    except ValueError:
        raise ValueError("Yearly period must be in the format 'YYYY-YYYY'.")
    except Exception as e:
        raise ValueError(f"An error occurred while filtering logs: {str(e)}")

# View to return filtered logs
def log_view(request):
    timeframe = request.GET.get('timeframe', 'Daily')
    period = request.GET.get('period', '2024-08')

    try:
        df_logs = parse_logs()
        if df_logs.empty:
            # Return an empty array based on the timeframe
            if timeframe == 'Daily':
                days_in_month = pd.Period(period + '-01').days_in_month
                return JsonResponse({'error_counts': [0] * days_in_month, 'recent_errors': []})
            elif timeframe == 'Monthly':
                return JsonResponse({'error_counts': [0] * 12, 'recent_errors': []})
            elif timeframe == 'Yearly':
                start_year, end_year = map(int, period.split('-'))
                return JsonResponse({'error_counts': [0] * (end_year - start_year + 1), 'recent_errors': []})

        # Filter logs based on timeframe and period
        df_filtered = filter_logs(df_logs, timeframe, period)
        if df_filtered.empty:
            if timeframe == 'Daily':
                days_in_month = pd.Period(period + '-01').days_in_month
                return JsonResponse({'error_counts': [0] * days_in_month, 'recent_errors': []})
            elif timeframe == 'Monthly':
                return JsonResponse({'error_counts': [0] * 12, 'recent_errors': []})
            elif timeframe == 'Yearly':
                start_year, end_year = map(int, period.split('-'))
                return JsonResponse({'error_counts': [0] * (end_year - start_year + 1), 'recent_errors': []})

        # Calculate the total number of errors for each period (e.g., days, months, years)
        error_counts = []
        if timeframe == 'Daily':
            days_in_month = pd.Period(period + '-01').days_in_month
            error_counts = [df_filtered[(df_filtered['timestamp'].dt.month == int(period.split('-')[1])) &
                                        (df_filtered['timestamp'].dt.day == day) &
                                        (df_filtered['type'] == 'error')].shape[0] for day in range(1, days_in_month+1)]
        elif timeframe == 'Monthly':
            error_counts = [df_filtered[(df_filtered['timestamp'].dt.year == int(period)) &
                                        (df_filtered['timestamp'].dt.month == month) &
                                        (df_filtered['type'] == 'error')].shape[0] for month in range(1, 13)]
        elif timeframe == 'Yearly':
            start_year, end_year = map(int, period.split('-'))
            error_counts = [df_filtered[(df_filtered['timestamp'].dt.year == year) &
                                        (df_filtered['type'] == 'error')].shape[0] for year in range(start_year, end_year + 1)]

        # Get the recent error messages based on the limit parameter
        recent_errors = df_filtered[df_filtered['type'] == 'error'].sort_values(by='timestamp', ascending=False).head(15).to_dict(orient='records')

        return JsonResponse({
            'error_counts': error_counts,
            'recent_errors': recent_errors
        })

    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"An unexpected error occurred: {str(e)}"}, status=500)

# Previous code comments for easy revert:
# In parse_logs:
# - The original code returned all log data without filtering to top 5 records and without sorting.
# In server_health:
# - The original code returned all recent logs without filtering to top 5 records and without sorting.
# In filter_logs:
# - The original code filtered logs by timeframe but didn't limit the results to the top 5 records per log type or sort them by timestamp.

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def custom_groups(request):
    try:
        custom_groups = CustomGroup.objects.all()
        data = [
            {
                "name": group.name,
                "id": group.id,
                "organization": group.organization_id if group.organization_id else "",
            }
            for group in custom_groups
        ]
        response = {
            'status': 'success',
            'message': gettext_lazy('Request processed successfully.'),
            'data': {
                'custom_groups': data
            }
        }
        return JsonResponse(response, status=status.HTTP_200_OK)
    except Exception as e:
        # Construct the error response
        error_response = {
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the custom groups.'),
            'error_code': 'CUSTOM_GROUP_FETCH_ERROR',
            'details': str(e)
        }
        return JsonResponse(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
    
    
@api_view(['GET'])
def user_type_list(request):
    try:
        # Assuming get_response_template() returns a dictionary
        response_data = get_response_template()
        user_type_list_choices = UserTypeOptions.get_user_type_options()
        user_type_list_choices_data = [{'id': choice[0], 'name': choice[1]}
                          for choice in user_type_list_choices]

        response_data.update({
            'status': 'success',
            'message': gettext_lazy('User type options fetched successfully.'),
            'data': {
                'user_types': user_type_list_choices_data
            }
        })
        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)

    except Exception as e:
        response_data.update({
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the user type list.'),
            'error_code': 'USER_TYPE_LIST_ERROR',
            'details': str(e)
        })
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
