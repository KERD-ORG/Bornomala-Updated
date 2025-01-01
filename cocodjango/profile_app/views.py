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
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from utils import upload_file
import os
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.storage import default_storage
from common.models import Document, UserDocument
from common.serializers import DocumentSerializer, UserDocumentSerializer
from rest_framework.exceptions import ValidationError
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from global_messages import SUCCESS_MESSAGES as GLOBAL_SUCCESS_MESSAGES
from error_codes import ErrorCodes
from .serializers import ResumeUploadSerializer, SopUploadSerializer
from utils import get_response_template
from rest_framework import viewsets   
from django.forms.models import model_to_dict  

from .models import TestScore
from .models import ReferenceInfo
from .reference_info_serializer import ReferenceInfoSerializer
from services import UserDataService
from services import CollegeDataService


import logging
import datetime
logger = logging.getLogger(__name__)


class UserBiographicInfoView(APIView):

    permission_classes = [IsAuthenticated]

    def get_user_details(self, user):
        try:
            user_extended, created = ExtendedUser.objects.get_or_create(
                user=user)
            user_details, created = UserDetails.objects.get_or_create(
                user=user)
            serializer = UserBiographicInformationSerializer(user_details)
            return serializer.data, user_details, created
        except UserDetails.DoesNotExist:
            return None, None, True

    @swagger_auto_schema(
        operation_summary="Get User Biographic Information",
        operation_description="Retrieve user biographic information.",
        responses={
            200: openapi.Response('Success', UserBiographicInformationSerializer),
            401: "Unauthorized",
            404: "Not Found",
        }
    )
    def get(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        user = request.user
        user_details_data, _, _ = self.get_user_details(user)
        if user_details_data is not None:
            response_data.update({
                'status': 'success',
                'data': user_details_data,
                'message': SUCCESS_MESSAGES['user_details_found'],
            })
        else:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        return Response(response_data, status=status_code)

    @swagger_auto_schema(
        operation_summary="Update User Biographic Information",
        operation_description="Update user biographic information.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'first_name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='First name',
                    example='John'
                ),
                'middle_name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Middle name',
                    example='A.'
                ),
                'last_name': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Last name',
                    example='Doe'
                ),
                'date_of_birth': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    format=openapi.FORMAT_DATE,
                    description='Date of birth (YYYY-MM-DD)',
                    example='1990-01-01'
                ),
                'city_of_birth': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='City of birth',
                    example='New York'
                ),
                'country_of_birth': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Country of birth',
                    example='USA'
                )
            }
        ),
        responses={
            200: openapi.Response(description="Success"),
            400: openapi.Response(description="Bad request"),
            401: "Unauthorized",
            404: "Not Found",
        }
    )
    @transaction.atomic
    def put(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            serializer = UserBiographicInformationSerializer(
                data=request.data, context={'request': request})

            if serializer.is_valid():
                user = request.user
                user_details_data, user_details_instance, created = self.get_user_details(
                    user)

                if created:
                    serializer.save(user=user)
                    response_data['data'] = serializer.data
                else:
                    serializer_instance = UserBiographicInformationSerializer(
                        user_details_instance, data=request.data, context={'request': request})
                    if serializer_instance.is_valid():
                        serializer_instance.save()
                        response_data.update({
                            'status': 'success',
                            'data': serializer_instance.data,
                            'message': SUCCESS_MESSAGES['profile_saved_success'],
                        })
                    else:
                        status_code = status.HTTP_400_BAD_REQUEST
                        response_data.update({
                            'status': 'error',
                            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                            'error_code': 'VALIDATION_ERROR',
                            'details': serializer_instance.errors
                        })
            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy(str(e)),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)


class UserContactInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get_user_details(self, user):
        try:
            user_details, created = UserDetails.objects.get_or_create(
                user=user)
            serializer = ContactInformationSerializer(user_details)
            return serializer.data, user_details, created
        except UserDetails.DoesNotExist:
            return None, None, True

    @swagger_auto_schema(
        operation_summary="Get User Contact Information",
        operation_description="Retrieve user contact information.",
        responses={
            200: openapi.Response('Success', ContactInformationSerializer),
            401: openapi.Response(description="Unauthorized"),
            404: openapi.Response(description="Not Found"),
        }
    )
    def get(self, request, format=None):
        # Using get_response_template from utils
        response_data = get_response_template()
        user = request.user
        user_details_data, _, _ = self.get_user_details(user)
        if user_details_data is not None:
            response_data.update({
                'status': 'success',
                'data': user_details_data,
                'message': SUCCESS_MESSAGES['user_details_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @swagger_auto_schema(
        operation_summary="Upload User Contact Information",
        operation_description="Upload user contact information.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'current_address_line1': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Current address line 1',
                    example='123 Main St'
                ),
                'current_address_line2': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Current address line 2',
                    example='Apt 4B'
                ),
                'current_city': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Current city',
                    example='New York'
                ),
                'current_state_province': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Current state or province',
                    example='NY'
                ),
                'current_postal_code': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Current postal code',
                    example='10001'
                ),
                'current_country': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Current country',
                    example='USA'
                ),
                'permanent_address_status': openapi.Schema(
                    type=openapi.TYPE_BOOLEAN,
                    description='Permanent address status',
                    example=True
                ),
                'permanent_address_line1': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Permanent address line 1',
                    example='456 Elm St'
                ),
                'permanent_address_line2': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Permanent address line 2',
                    example='Suite 8'
                ),
                'permanent_city': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Permanent city',
                    example='Los Angeles'
                ),
                'permanent_state_province': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Permanent state or province',
                    example='CA'
                ),
                'permanent_postal_code': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Permanent postal code',
                    example='90001'
                ),
                'permanent_country': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Permanent country',
                    example='USA'
                )
            }
        ),
        responses={
            200: openapi.Response(description="Success"),
            400: openapi.Response(description="Bad request"),
            401: openapi.Response(description="Unauthorized"),
            500: openapi.Response(description="Internal server error")
        }
    )
    @transaction.atomic
    def put(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            serializer = ContactInformationSerializer(
                data=request.data, context={'request': request})

            if serializer.is_valid():
                user = request.user
                user_details_data, user_details_instance, created = self.get_user_details(
                    user)

                if created:
                    serializer.save(user=user)
                    response_data['data'] = serializer.data
                else:
                    serializer_instance = ContactInformationSerializer(
                        user_details_instance, data=request.data, context={'request': request})
                    if serializer_instance.is_valid():
                        serializer_instance.save()
                        response_data.update({
                            'status': 'success',
                            'data': serializer_instance.data,
                            'message': SUCCESS_MESSAGES['profile_saved_success'],
                        })
                    else:
                        status_code = status.HTTP_400_BAD_REQUEST
                        response_data.update({
                            'status': 'error',
                            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                            'error_code': 'VALIDATION_ERROR',
                            'details': serializer_instance.errors
                        })
            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy(str(e)),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)


class CitizenshipAndVisaInfoView(APIView):

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Get citizenship and visa information"),
        operation_description=gettext_lazy(
            "Get citizenship and visa information for a user."),
        responses={
            200: openapi.Response(
                description=gettext_lazy("A list of citizenships and visas."),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'citizenships': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
                        'visas': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT))
                    }
                )
            ),
            404: openapi.Response(description=gettext_lazy("UserDetails not found")),
        }
    )
    
    def get(self, request, format=None):
        response_data = get_response_template()
        user = request.user
        try:
            user_details = UserDetails.objects.get(user=user)
            citizenship_info = Citizenship.objects.filter(user_details=user_details)
            serializer = CitizenshipSerializer(citizenship_info, many=True)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                "message": gettext_lazy("Citizenship information retrieved successfully."),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except UserDetails.DoesNotExist:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @transaction.atomic
    def post(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            serializer = CitizenshipSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Citizenship information added successfully."),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)
    
    @transaction.atomic
    def put(self, request, pk, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            citizenship = get_object_or_404(Citizenship, pk=pk, user_details=user_details)
            serializer = CitizenshipSerializer(citizenship, data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Citizenship information updated successfully."),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Delete Citizenship information"),
        operation_description=gettext_lazy("Delete an existing Citizenship information."),
        responses={
            204: openapi.Response(description="No Content"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def delete(self, request, pk, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        citizenship = get_object_or_404(Citizenship, pk=pk, user_details=user_details, deleted_at__isnull=True)
        citizenship.delete()
        return Response({
            "status": "success",
            "message": gettext_lazy("Citizenship information deleted successfully."),
            "data": None
        }, status=status.HTTP_204_NO_CONTENT)


class VisaInfoView(APIView):
    
    def get(self, request, format=None):
        response_data = get_response_template()
        user = request.user
        try:
            user_details = UserDetails.objects.get(user=user)
            visa = Visa.objects.filter(user_details=user_details)
            serializer = VisaSerializer(visa, many=True)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                "message": gettext_lazy("Visa information retrieved successfully."),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except UserDetails.DoesNotExist:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @transaction.atomic
    def post(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            serializer = VisaSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Visa information added successfully."),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)
    
    @transaction.atomic
    def put(self, request, pk, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            visa = get_object_or_404(Visa, pk=pk, user_details=user_details)
            serializer = VisaSerializer(visa, data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Visa information updated successfully."),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)

    @transaction.atomic
    def delete(self, request, pk, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        visa = get_object_or_404(Visa, pk=pk, user_details=user_details, deleted_at__isnull=True)
        visa.delete()
        return Response({
            "status": "success",
            "message": gettext_lazy("Visa information deleted successfully."),
            "data": None
        }, status=status.HTTP_204_NO_CONTENT)


class ResearchInterestInfoView(APIView):
    
    @swagger_auto_schema(
        operation_summary=gettext_lazy("Retrieve user's research interests"),
        operation_description=gettext_lazy("Retrieves the research interests associated with the authenticated user."),
        responses={
            200: openapi.Response(
                description=_("Successful retrieval of research interests"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='success'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Research interests retrieved successfully.')
                    }
                )
            ),
            404: openapi.Response(
                description=_("Research interests not found for the user"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='RESEARCH_INTEREST_NOT_FOUND'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Research interests not found for this user.'),
                        'details': None,
                    }
                )
            )
        }
    )
    
    def get(self, request, *args, **kwargs):
        user = request.user
        try:
            research_interests = ResearchInterest.objects.filter(
                user_details__user=user).select_related('research_interests_option')
            serializer = ResearchInterestSerializer(
                research_interests, many=True)
            return Response({
                "status": "success",
                "message": gettext_lazy("Research interests retrieved successfully."),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except ResearchInterest.DoesNotExist:
            return Response({
                "status": "error",
                "error_code": "RESEARCH_INTEREST_NOT_FOUND",
                "message": gettext_lazy("Research interests not found for this user."),
                "details": None
            }, status=status.HTTP_404_NOT_FOUND)
            
    
    
    @swagger_auto_schema(
        operation_summary=_("Save user's research interests"),
        operation_description=gettext_lazy("Saves the user's research interests based on the provided data. Expects a JSON array of research interests."),
        request_body=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'topic': openapi.Schema(type=openapi.TYPE_STRING, example='Machine Learning'),
                    'user_details': openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
                }
            ),
            required=['topic', 'user_details']
        ),
        responses={
            200: openapi.Response(
                description=gettext_lazy("Successful saving of research interests"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='success'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Research interests saved successfully.'),
                
                    }
                )
            ),
            400: openapi.Response(
                description=_("Validation error occurred"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='VALIDATION_ERROR'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Validation error occurred.'),
                        'details': openapi.Schema(type=openapi.TYPE_OBJECT, additionalProperties=openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING))),
                    }
                )
            ),
            404: openapi.Response(
                description=_("User details not found"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='USER_DETAILS_NOT_FOUND'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='User details not found.'),
                        'details': None,
                    }
                )
            ),
            500: openapi.Response(
                description=_("Internal server error occurred"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='INTERNAL_SERVER_ERROR'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='An error occurred while processing the request.'),
                        'details': None
                    }
                )
            )
        }
    )
            
    @transaction.atomic     
    def post(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        
        user = request.user
        
        try:
            user_details = UserDetails.objects.get(user=user)
        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("User details not found."),
                'error_code': 'USER_DETAILS_NOT_FOUND',
                'details': None
            })
            
        research_interests_data = request.data
        
        
        try:
            if not isinstance(research_interests_data, list):
                raise ValidationError({
                    "research_interests": gettext_lazy("Invalid data format. Expected a list.")
                })

            if len(research_interests_data) == 0:
                raise ValidationError({
                    "research_interests": gettext_lazy("At least one research interest is required.")
                })
        except ValidationError as e:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("Validation error occurred."),
                'error_code': 'VALIDATION_ERROR',
                'details': e.detail
            })
            status_code = status.HTTP_400_BAD_REQUEST
            return Response(response_data, status=status_code)

        
        try:    
            errors = []
            valid_data = []

            for data in research_interests_data:
                data['user_details'] = user_details.id
                serializer = ResearchInterestSerializer(data=data)
                try:
                    serializer.is_valid(raise_exception=True)
                    valid_data.append(serializer.validated_data)
                except ValidationError as e:
                    errors.append(e.detail)

            if errors:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message':  gettext_lazy("Validation error occurred."),
                    'error_code': 'VALIDATION_ERROR',
                    'details': None
                })
        
            with transaction.atomic():
                # Delete existing research interests for the user
                ResearchInterest.objects.filter(user_details=user_details).delete()
                # Create new research interests
                research_interests = [ResearchInterest(
                    **item) for item in valid_data]
                ResearchInterest.objects.bulk_create(research_interests)
                
            
            response_data.update({
                    'status': 'success',
                    'data': research_interests_data,
                    'message': gettext_lazy("Research interests saved successfully."),
                })
            
            return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            transaction.set_rollback(True)
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

   
class EthnicityInfoView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=_("Get Ethnicity Info"),
        operation_description=gettext_lazy(
            "Allows authenticated users to fetch their ethnicity information."),
        responses={
            200: openapi.Response(
                description=gettext_lazy("Success"),
                examples={
                    'application/json': {
                        'status': 'success',
                        'data': {
                            'ethnicity': 'White',
                            'ethnicity_details': 'Details',
                            'ethnicity_origin': 'true',
                            'ethnicity_reporting': 'true'
                        }
                    }
                }
            ),
            404: openapi.Response(description=gettext_lazy("User details not found")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        }
    )
    @transaction.atomic
    def get(self, request, format=None):
        response_data = get_response_template()
        user = request.user

        try:
            user_details = UserDetails.objects.get(user=user)
            serializer = EthnicityInfoSerializer(user_details)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': SUCCESS_MESSAGES['user_details_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except UserDetails.DoesNotExist:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @swagger_auto_schema(
        operation_summary=_("Update Ethnicity Info"),
        operation_description=gettext_lazy(
            "Allows authenticated users to update their ethnicity information."),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['ethnicity', 'ethnicity_origin', 'ethnicity_reporting'],
            properties={
                'ethnicity': openapi.Schema(type=openapi.TYPE_STRING, description=_('Ethnicity')),
                'ethnicity_details': openapi.Schema(type=openapi.TYPE_STRING, description=_('Ethnicity details')),
                'ethnicity_origin': openapi.Schema(type=openapi.TYPE_STRING, description=_('Ethnicity origin')),
                'ethnicity_reporting': openapi.Schema(type=openapi.TYPE_STRING, description=_('Preference on Ethnicity Reporting')),
            }
        ),
        responses={
            200: openapi.Response(description=gettext_lazy("Success")),
            400: openapi.Response(description=gettext_lazy("Bad Request")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        },
        tags=['Ethnicity']
    )
    @transaction.atomic
    def put(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            serializer = EthnicityInfoSerializer(
                user_details, data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': gettext_lazy('Ethnicity details updated successfully'),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)


class OtherInfoView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=_("Get Other Info"),
        operation_description=gettext_lazy(
            "Allows authenticated users to fetch their other information."),
        responses={
            200: openapi.Response(
                description=gettext_lazy("Success"),
                examples={
                    'application/json': {
                        'status': 'success',
                        'data': {
                            'field1': 'value1',
                            'field2': 'value2',
                            'field3': 'value3'
                        }
                    }
                }
            ),
            404: openapi.Response(description=gettext_lazy("User details not found")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        }
    )
    @transaction.atomic
    def get(self, request, format=None):
        response_data = get_response_template()
        user = request.user

        try:
            user_details = UserDetails.objects.get(user=user)
            serializer = OtherInfoSerializer(user_details)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': SUCCESS_MESSAGES['user_details_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except UserDetails.DoesNotExist:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @swagger_auto_schema(
        operation_summary=_("Update Other Info"),
        operation_description=gettext_lazy(
            "Allows authenticated users to update their other information."),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['field1', 'field2', 'field3'],
            properties={
                'field1': openapi.Schema(type=openapi.TYPE_STRING, description=_('Field 1')),
                'field2': openapi.Schema(type=openapi.TYPE_STRING, description=_('Field 2')),
                'field3': openapi.Schema(type=openapi.TYPE_STRING, description=_('Field 3')),
            }
        ),
        responses={
            200: openapi.Response(description=gettext_lazy("Success")),
            400: openapi.Response(description=gettext_lazy("Bad Request")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        },
        tags=['Other']
    )
    @transaction.atomic
    def put(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            serializer = OtherInfoSerializer(
                user_details, data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': gettext_lazy('Other info updated successfully'),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)


class AcknowledgementInfoView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=_("Get Acknowledgement Info"),
        operation_description=gettext_lazy(
            "Allows authenticated users to fetch their acknowledgement information."),
        responses={
            200: openapi.Response(
                description=gettext_lazy("Success"),
                examples={
                    'application/json': {
                        'status': 'success',
                        'data': {
                            'field1': 'value1',
                            'field2': 'value2',
                            'field3': 'value3'
                        }
                    }
                }
            ),
            404: openapi.Response(description=gettext_lazy("User details not found")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        }
    )
    @transaction.atomic
    def get(self, request, format=None):
        response_data = get_response_template()
        user = request.user

        try:
            user_details = UserDetails.objects.get(user=user)
            serializer = AcknowledgementInfoSerializer(user_details)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': gettext_lazy("User details found."),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except UserDetails.DoesNotExist:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("User details not found."),
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("An error occurred while processing the request"),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @swagger_auto_schema(
        operation_summary=_("Update Acknowledgement Info"),
        operation_description=gettext_lazy(
            "Allows authenticated users to update their acknowledgement information."),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['field1', 'field2', 'field3'],
            properties={
                'field1': openapi.Schema(type=openapi.TYPE_STRING, description=_('Field 1')),
                'field2': openapi.Schema(type=openapi.TYPE_STRING, description=_('Field 2')),
                'field3': openapi.Schema(type=openapi.TYPE_STRING, description=_('Field 3')),
            }
        ),
        responses={
            200: openapi.Response(description=gettext_lazy("Success")),
            400: openapi.Response(description=gettext_lazy("Bad Request")),
            500: openapi.Response(description=gettext_lazy("Internal Server Error"))
        },
        tags=['Acknowledgement']
    )
    @transaction.atomic
    def put(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            serializer = AcknowledgementInfoSerializer(
                user_details, data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': gettext_lazy("Acknowledgement updated successfully"),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy("Validation error"),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("User details not found."),
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("An error occurred while processing the request"),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)
            
class SkillInfoView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=_("Retrieve user's skills"),
        operation_description=_("Retrieves the skills associated with the authenticated user."),
        responses={
            200: openapi.Response(
                description=_("Successful retrieval of skills"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='success'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Skills retrieved successfully.')
                    }
                )
            ),
            404: openapi.Response(
                description=_("Skills not found for the user"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='SKILLS_NOT_FOUND'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Skills not found for this user.'),
                        'details': None,
                    }
                )
            )
        }
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        try:
            skills = Skill.objects.filter(
                user_details__user=user).select_related('skill_option')
            serializer = SkillSerializer(skills, many=True)
            return Response({
                "status": "success",
                "message": _("Skills retrieved successfully."),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Skill.DoesNotExist:
            return Response({
                "status": "error",
                "error_code": "SKILLS_NOT_FOUND",
                "message": _("Skills not found for this user."),
                "details": None
            }, status=status.HTTP_404_NOT_FOUND)

    @swagger_auto_schema(
        operation_summary=_("Save user's skills"),
        operation_description=_("Saves the user's skills based on the provided data. Expects a JSON array of skills."),
        request_body=openapi.Schema(
            type=openapi.TYPE_ARRAY,
            items=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'skill_name': openapi.Schema(type=openapi.TYPE_STRING, example='Python'),
                    'user_details': openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
                }
            ),
            required=['skill_name', 'user_details']
        ),
        responses={
            200: openapi.Response(
                description=_("Successful saving of skills"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='success'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Skills saved successfully.'),
                    }
                )
            ),
            400: openapi.Response(
                description=_("Validation error occurred"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='VALIDATION_ERROR'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Validation error occurred.'),
                        'details': openapi.Schema(type=openapi.TYPE_OBJECT, additionalProperties=openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING))),
                    }
                )
            ),
            404: openapi.Response(
                description=_("User details not found"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='USER_DETAILS_NOT_FOUND'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='User details not found.'),
                        'details': None,
                    }
                )
            ),
            500: openapi.Response(
                description=_("Internal server error occurred"),
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, example='error'),
                        'error_code': openapi.Schema(type=openapi.TYPE_STRING, example='INTERNAL_SERVER_ERROR'),
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example='An error occurred while processing the request.'),
                        'details': None
                    }
                )
            )
        }
    )
    @transaction.atomic
    def post(self, request, format=None):
        status_code = status.HTTP_200_OK
        response_data = {'status': 'success'}

        user = request.user

        try:
            user_details = UserDetails.objects.get(user=user)
        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': _("User details not found."),
                'error_code': 'USER_DETAILS_NOT_FOUND',
                'details': None
            })
            return Response(response_data, status=status_code)

        skills_data = request.data

        try:
            if not isinstance(skills_data, list):
                raise ValidationError({
                    "skills": _("Invalid data format. Expected a list.")
                })

            if len(skills_data) == 0:
                raise ValidationError({
                    "skills": _("At least one skill is required.")
                })
        except ValidationError as e:
            response_data.update({
                'status': 'error',
                'message': _("Validation error occurred."),
                'error_code': 'VALIDATION_ERROR',
                'details': e.detail
            })
            status_code = status.HTTP_400_BAD_REQUEST
            return Response(response_data, status=status_code)

        try:
            errors = []
            valid_data = []

            for data in skills_data:
                data['user_details'] = user_details.id
                serializer = SkillSerializer(data=data)
                try:
                    serializer.is_valid(raise_exception=True)
                    valid_data.append(serializer.validated_data)
                except ValidationError as e:
                    errors.append(e.detail)

            if errors:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': _("Validation error occurred."),
                    'error_code': 'VALIDATION_ERROR',
                    'details': errors
                })
                return Response(response_data, status=status_code)

            with transaction.atomic():
                # Delete existing skills for the user
                Skill.objects.filter(user_details=user_details).delete()
                # Create new skills
                skills = [Skill(**item) for item in valid_data]
                Skill.objects.bulk_create(skills)

            response_data.update({
                'status': 'success',
                'data': skills_data,
                'message': _("Skills saved successfully."),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            transaction.set_rollback(True)
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': _('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })
            return Response(response_data, status=status_code)


class VolunteerActivityView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=_("Get Volunteer Activities"),
        operation_description=_("Retrieve user's volunteer activities."),
        responses={
            200: openapi.Response('Success', VolunteerActivitySerializer(many=True)),
            401: openapi.Response(description="Unauthorized"),
            404: openapi.Response(description="Not Found"),
        }
    )
    def get(self, request, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        volunteer_activities = VolunteerActivity.objects.filter(user_details=user_details, deleted_at__isnull=True)
        serializer = VolunteerActivitySerializer(volunteer_activities, many=True)
        
        #user_data_service = UserDataService(2)
        #user_data = user_data_service.get_flat_user_data()
        
        #flat_colleges_data = CollegeDataService.get_all_flat_colleges_data()
        
        return Response({
            "status": "success",
            "message": _("Volunteer activities retrieved successfully."),
            "data": serializer.data,
            #"extra_data": user_data
            #"extra_data": flat_colleges_data,
            #"extra_data": flat_departments_data
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary=_("Add Volunteer Activity"),
        operation_description=_("Add a new volunteer activity."),
        request_body=VolunteerActivitySerializer,
        responses={
            201: openapi.Response("Created", VolunteerActivitySerializer),
            400: openapi.Response(description="Bad Request"),
            500: openapi.Response(description="Internal Server Error"),
        }
    )
    @transaction.atomic
    def post(self, request, format=None):
        serializer = VolunteerActivitySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": _("Volunteer activity added successfully."),
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            "status": "error",
            "error_code": "VALIDATION_ERROR",
            "message": _("Validation error occurred."),
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary=_("Update Volunteer Activity"),
        operation_description=_("Update an existing volunteer activity."),
        request_body=VolunteerActivitySerializer,
        responses={
            200: openapi.Response("Updated", VolunteerActivitySerializer),
            400: openapi.Response(description="Bad Request"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def put(self, request, pk, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        volunteer_activity = get_object_or_404(VolunteerActivity, pk=pk, user_details=user_details, deleted_at__isnull=True)
        serializer = VolunteerActivitySerializer(volunteer_activity, data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": _("Volunteer activity updated successfully."),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({
            "status": "error",
            "error_code": "VALIDATION_ERROR",
            "message": _("Validation error occurred."),
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary=_("Delete Volunteer Activity"),
        operation_description=_("Delete an existing volunteer activity."),
        responses={
            204: openapi.Response(description="No Content"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def delete(self, request, pk, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        volunteer_activity = get_object_or_404(VolunteerActivity, pk=pk, user_details=user_details, deleted_at__isnull=True)
        volunteer_activity.delete()
        return Response({
            "status": "success",
            "message": _("Volunteer activity deleted successfully."),
            "data": None
        }, status=status.HTTP_204_NO_CONTENT)
        
   
def serialize_instance(instance):
    """
    Serialize a model instance to a dictionary, ensuring all fields are JSON serializable.
    """
    data = {}
    for field in instance._meta.get_fields():
        value = getattr(instance, field.name, None)
        if value is None:
            data[field.name] = value
        elif field.is_relation:
            if field.many_to_one or field.one_to_one:
                data[field.name] = str(value)  # Use the string representation of the related instance
            elif field.one_to_many or field.many_to_many:
                data[field.name] = [str(related_instance) for related_instance in value.all()]
        else:
            data[field.name] = value
    return data
