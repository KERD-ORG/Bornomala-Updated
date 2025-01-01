from django.core.exceptions import FieldError
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.translation import gettext_lazy as _
from django_countries import countries

from .models import Campus
from .serializers import CampusSerializer
from common.models import UserDocument
from utils import get_response_template, upload_file
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from utils import get_user_info_data, has_custom_perm


class CampusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        if not has_custom_perm(request.user, 'campus_app.view_campus'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        response_data = get_response_template()
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 50))
        sort_columns_param = request.GET.get('sortColumns', '')
        sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else []
        search_term = request.GET.get('searchTerm', '')
        campus_data = Campus.objects.all()
        
        user_data = get_user_info_data(request.user)
        organization_id = user_data["organization"]["id"] if user_data["organization"] else None
        if organization_id:
            campus_data = campus_data.filter(educational_organization__id=organization_id)
        elif 'roles' in user_data and user_data['roles']:
            pass
        else:
            response_data.update({
                'status': 'error',
                'message': 'Bad request was sent.',
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)


        if search_term:
            q_objects = Q(
                campus_name__icontains=search_term
            ) | Q(
                address_line1__icontains=search_term
            ) | Q(
                address_line2__icontains=search_term
            ) | Q(
                city__icontains=search_term
            ) | Q(
                postal_code__icontains=search_term
            ) | Q(
                educational_organization__name__icontains=search_term
            ) | Q(
                state_province__name__icontains=search_term
            )
            country_codes = [code for code, name in countries if search_term.lower() in name.lower()]
            q_objects |= Q(
                country_code__in=country_codes
            )
            
            campus_data = campus_data.filter(q_objects)

        if not sort_columns:
            sort_columns = ['-created_at']

        try:
            campus_data = campus_data.order_by(*sort_columns)
        except FieldError as e:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['campus_data_not_found'],
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        campus_data_page = campus_data[offset:offset + limit]

        if campus_data_page:
            campus_serialized_data = CampusSerializer(campus_data_page, many=True).data

            response_data.update({
                'status': 'success',
                'data': campus_serialized_data,
                'message': SUCCESS_MESSAGES['campus_data_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['campus_data_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request, format=None):
        if not has_custom_perm(request.user, 'campus_app.add_campus'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
            
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        campus_data = request.data

        try:
            serializer_instance = CampusSerializer(data=campus_data)
            if serializer_instance.is_valid():
                serializer_instance.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer_instance.data,
                    'message': SUCCESS_MESSAGES['campus_saved_success'],
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
            response_data.update({
                'status': 'error',
                'message': _("Validation error occurred."),
                'error_code': 'VALIDATION_ERROR',
                'details': e.detail
            })
            status_code = status.HTTP_400_BAD_REQUEST

        return Response(response_data, status=status_code)

    @transaction.atomic
    def put(self, request, pk, format=None):
        if not has_custom_perm(request.user, 'campus_app.change_campus'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        campus_data = request.data

        try:
            campus_instance = Campus.objects.get(pk=pk)

            serializer_instance = CampusSerializer(
                instance=campus_instance,
                data=campus_data,
                partial=True
            )

            if serializer_instance.is_valid():
                serializer_instance.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer_instance.data,
                    'message': SUCCESS_MESSAGES['campus_updated_success'],
                })
            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer_instance.errors
                })

        except Campus.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': _("Campus not found."),
                'error_code': 'NOT_FOUND',
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

    @transaction.atomic
    def delete(self, request, pk, format=None):
        if not has_custom_perm(request.user, 'campus_app.delete_campus'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        response_data = get_response_template()
        campus = get_object_or_404(Campus, pk=pk)

        try:
            campus.soft_delete()
            response_data.update({
                'status': 'success',
                'data': None,
                'message': _('Campus deleted successfully.'),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': _('An error occurred while deleting the campus.'),
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)