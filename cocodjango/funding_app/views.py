import os
from django.conf import settings
from django.db.models import Q
from django.core.exceptions import FieldError,SuspiciousFileOperation
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import permission_classes
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from utils import delete_uploaded_files
from .models import Funding, Benefit
from .serializers import FundingSerializer, BenefitSerializer
from common.models import Document, UserDocument
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from utils import get_response_template, upload_file
import json

class FundingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None):
        response_data = get_response_template()
        
        if pk:
            funding = get_object_or_404(Funding, pk=pk, deleted_at__isnull=True)
            serializer = FundingSerializer(funding)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Funding record retrieved successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)    

        else:
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 50))
            sort_columns_param = request.GET.get('sortColumns', '')
            sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else ['-created_at']
            search_term = request.GET.get('searchTerm', '')

            funding_data = Funding.objects.filter(deleted_at__isnull=True)

            if search_term:   
                q_objects = Q(
                    title_of_funding__icontains=search_term
                ) | Q(
                    funding_for_edu_org__name__icontains=search_term
                ) | Q(
                    funding_for_college__name__icontains=search_term
                ) | Q(
                    funding_for_dept__name__icontains=search_term
                ) | Q(
                    funding_for_faculty_member__user__username__icontains=search_term
                ) | Q(
                    funding_for_other_name__icontains=search_term
                ) | Q(
                    funding_opportunity_for__icontains=search_term
                ) | Q(
                    funding_type__icontains=search_term
                ) | Q(
                    funding_type_name__icontains=search_term
                ) | Q(
                    amount_type__icontains=search_term
                ) | Q(
                    amount_type_name__icontains=search_term
                ) | Q(
                    amount__icontains=search_term
                ) | Q(
                    benefits__name__icontains=search_term
                ) | Q(
                    funding_open_date__icontains=search_term
                ) | Q(
                    funding_end_date__icontains=search_term
                ) | Q(
                    web_address__icontains=search_term
                ) | Q(
                    description__icontains=search_term
                )
                funding_data = funding_data.filter(q_objects)

            try:    
                funding_data = funding_data.distinct()
                funding_data = funding_data.order_by(*sort_columns)
            except FieldError as e:
                response_data.update({
                    'status': 'error',
                    'message': str(e),
                    'error_code': 'BAD_REQUEST',
                })
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

            funding_data_page = funding_data[offset:offset + limit]

            if funding_data_page:
        
                serializer = FundingSerializer(funding_data_page, context={'request': request}, many=True)
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': _('Funding records retrieved successfully.')
                })
                return Response(response_data, status=status.HTTP_200_OK)
            else:      
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['no_records_found'],
                    'error_code': 'RESOURCE_NOT_FOUND',
                })
                return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request):
        response_data = get_response_template()
        funding_data = request.data
        
        try:
            document_file = request.FILES.get('funding_doc_file', None)
            if document_file:
                content_type = document_file.content_type.lower()
                allowed_image_types = ['image/jpeg', 'image/png']
                allowed_pdf_type = ['application/pdf']

                if content_type not in allowed_image_types and content_type not in allowed_pdf_type:
                    response_data.update({
                        'status': 'error',
                        'message': _('Only JPG, PNG image files or PDF documents are allowed.'),
                        'error_code': 'VALIDATION_ERROR',
                        'details': None
                    })
                    return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
            serializer = FundingSerializer(data=funding_data, context={'request': request})
            if serializer.is_valid():
                if 'funding_doc_file' in request.FILES and request.FILES['funding_doc_file'] is not None:
                    user = request.user
                    file_upload_success, file_upload_error = upload_file(
                        document_file, 'sop' ,user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE'))
                    )
                    
                    if not file_upload_success:
                        response_data.update({
                            'status': 'error',
                            'message': _('File upload failed.'),
                            'error_code': 'VALIDATION_ERROR',
                            'details': file_upload_error
                        })
                        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
                    upload_file_id = Document.objects.filter(user=user).latest('created_at').id
                    funding_data['funding_doc'] = upload_file_id

                    serializer = FundingSerializer(data=funding_data, context={'request': request})
                if serializer.is_valid():
                    serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': _('Funding record created successfully.')
                })
                return Response(response_data, status=status.HTTP_201_CREATED)
            response_data.update({
                'status': 'error',
                'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                'error_code': 'VALIDATION_ERROR',
                'details': serializer.errors
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            response_data.update({
                'status': 'error',
                'message': _('Validation error occurred.'),
                'error_code': 'VALIDATION_ERROR',
                'details': e.detail
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
    @transaction.atomic
    def put(self, request, pk):
        response_data = get_response_template()
        funding = get_object_or_404(Funding, pk=pk)
        funding_serialized = FundingSerializer(funding, context={'request': request}).data
        funding_data = request.data
        file_path = None

        try:
            document_file = request.FILES.get('funding_doc_file', None)
            if document_file:
                content_type = document_file.content_type.lower()
                allowed_image_types = ['image/jpeg', 'image/png']
                allowed_pdf_type = ['application/pdf']

                if content_type not in allowed_image_types and content_type not in allowed_pdf_type:
                    response_data.update({
                        'status': 'error',
                        'message': _('Only JPG, PNG image files or PDF documents are allowed.'),
                        'error_code': 'VALIDATION_ERROR',
                        'details': None
                    })
                    return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

            serializer = FundingSerializer(funding, data=funding_data, context={'request': request}, partial=True)
            
            if serializer.is_valid():
                if document_file:
                    user = request.user
                    file_upload_success, file_upload_error, file_path = upload_file(
                        document_file, 'sop', user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')), return_file_path=True
                    )
                    
                    if not file_upload_success:
                        response_data.update({
                            'status': 'error',
                            'message': _('File upload failed.'),
                            'error_code': 'VALIDATION_ERROR',
                            'details': file_upload_error
                        })
                        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

                    previous_file_url = funding_serialized.get("funding_doc_url", None)
                    
                    if previous_file_url:
                        previous_file_path = previous_file_url.replace(settings.MEDIA_URL, '')
                        previous_file_full_path = os.path.join(settings.MEDIA_ROOT, previous_file_path)

                        if os.path.exists(previous_file_full_path):
                            delete_uploaded_files([previous_file_full_path])
                    
                    upload_file_id = Document.objects.filter(user=user).latest('created_at').id
                    funding_data['funding_doc'] = upload_file_id

                serializer = FundingSerializer(funding, data=funding_data, context={'request': request}, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    response_data.update({
                        'status': 'success',
                        'data': serializer.data,
                        'message': _('Funding record updated successfully.')
                    })
                    return Response(response_data, status=status.HTTP_200_OK)

        except SuspiciousFileOperation as e:
            if file_path:
                delete_uploaded_files([file_path])
            response_data.update({
                'status': 'error',
                'message': _('Validation error occurred.'),
                'error_code': 'VALIDATION_ERROR',
                'details': "File upload failed"
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            if file_path:
                delete_uploaded_files([file_path])
            response_data.update({
                'status': 'error',
                'message': _('Validation error occurred.'),
                'error_code': 'VALIDATION_ERROR',
                'details': e.detail
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk):
        response_data = get_response_template()
        funding = get_object_or_404(Funding, pk=pk)
        funding.deleted_at = timezone.now()
        funding.save()
        response_data.update({
            'status': 'success',
            'message': _('Funding record deleted successfully.')
        })
        return Response(response_data, status=status.HTTP_204_NO_CONTENT)


class BenefitView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        response_data = get_response_template()
        if pk:
            benefit = get_object_or_404(Benefit, pk=pk, deleted_at__isnull=True)
            serializer = BenefitSerializer(benefit)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Benefit record retrieved successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 50))
            sort_columns_param = request.GET.get('sortColumns', '')
            sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else ['-created_at']
            search_term = request.GET.get('searchTerm', '')

            benefit_data = Benefit.objects.filter(deleted_at__isnull=True)

            if search_term:
                q_objects = Q(
                    name__icontains=search_term
                ) | Q(
                    details__icontains=search_term
                )
                benefit_data = benefit_data.filter(q_objects)

            try:
                benefit_data = benefit_data.order_by(*sort_columns)
            except FieldError as e:
                response_data.update({
                    'status': 'error',
                    'message': str(e),
                    'error_code': 'BAD_REQUEST',
                })
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

            benefit_data_page = benefit_data[offset:offset + limit]

            if benefit_data_page:
                serializer = BenefitSerializer(benefit_data_page, many=True)
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': _('Benefit records retrieved successfully.')
                })
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['no_records_found'],
                    'error_code': 'RESOURCE_NOT_FOUND',
                })
                return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request):
        response_data = get_response_template()
        serializer = BenefitSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Benefit record created successfully.')
            })
            return Response(response_data, status=status.HTTP_201_CREATED)
        response_data.update({
            'status': 'error',
            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
            'error_code': 'VALIDATION_ERROR',
            'details': serializer.errors
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, pk):
        response_data = get_response_template()
        benefit = get_object_or_404(Benefit, pk=pk)
        serializer = BenefitSerializer(benefit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Benefit record updated successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)
        response_data.update({
            'status': 'error',
            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
            'error_code': 'VALIDATION_ERROR',
            'details': serializer.errors
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk):
        response_data = get_response_template()
        benefit = get_object_or_404(Benefit, pk=pk)
        benefit.deleted_at = timezone.now()
        benefit.save()
        response_data.update({
            'status': 'success',
            'message': _('Benefit record deleted successfully.')
        })
        return Response(response_data, status=status.HTTP_204_NO_CONTENT)

from django.contrib.auth.models import User
from faculty_members_app.models import FacultyMembers 
from faculty_members_app.serializers import FacultyMembersSerializer
class FundingForChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response_data = get_response_template()
        user = request.user
        funding_for_choices = []

        try:
            faculty_member = FacultyMembers.objects.filter(user=user).first()
            faculty_member_data = FacultyMembersSerializer(faculty_member).data
            faculty_dept_institute = faculty_member_data.get('faculty_dept_institute', None)
        except FacultyMembers.DoesNotExist:
            faculty_dept_institute = None 
            faculty_member_data= None

        #if user.has_perm('funding_app.add_department_funding'):
        funding_for_choices.append({'value': 'Department', 'label': 'Department'})
        #if user.has_perm('funding_app.add_college_funding'):
        funding_for_choices.append({'value': 'College', 'label': 'College'})
        #if user.has_perm('funding_app.add_edu_org_funding'):
        funding_for_choices.append({'value': 'EDU_ORG', 'label': 'Educational Organization'})
        #if user.has_perm('funding_app.add_faculty_funding') or faculty_dept_institute is not None:
        funding_for_choices.append({'value': 'Faculty', 'label': 'Faculty'})
        #if user.has_perm('funding_app.add_others_funding'):
        funding_for_choices.append({'value': 'Other', 'label': 'Others'})

        response_data.update({
            'status': 'success',
            'message': _('Funding choice record deleted successfully.'),
            'data':{
                'funding_for_choices': funding_for_choices,
                'faculty': faculty_member_data
            }
        })
        return Response(response_data, status=status.HTTP_200_OK)

