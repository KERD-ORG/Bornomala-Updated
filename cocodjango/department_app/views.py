from django.core.exceptions import FieldError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Department
from .serializers import DepartmentSerializer
from utils import get_response_template
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from django.utils.translation import gettext_lazy as _
from django_countries import countries
from utils import get_user_info_data, has_custom_perm

class DepartmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        if not has_custom_perm(request.user, 'department_app.view_department'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        response_data = get_response_template()
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 50))
        sort_columns_param = request.GET.get('sortColumns', '')
        sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else []
        search_term = request.GET.get('searchTerm', '')

        department_data = Department.objects.all()
        
        user_data = get_user_info_data(request.user)
        organization_id = user_data["organization"]["id"] if user_data["organization"] else None
        if organization_id:
            department_data = department_data.filter(college__campus__educational_organization__id=organization_id)
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
                name__icontains=search_term
            ) | Q(
                web_address__icontains=search_term
            ) | Q(
                statement__icontains=search_term
            ) | Q(
                college__campus__campus_name__icontains=search_term
            ) | Q(
                college__name__icontains=search_term
            )| Q(
                status__icontains=search_term
            )
            country_codes = [code for code, name in countries if search_term.lower() in name.lower()]
            q_objects |= Q(
                address_line1__icontains=search_term
            ) | Q(
                address_line2__icontains=search_term
            ) | Q(
                city__icontains=search_term
            ) | Q(
                postal_code__icontains=search_term
            ) | Q(
                state_province__name__icontains=search_term
            ) | Q(
                country_code__in=country_codes
            )
            department_data = department_data.filter(q_objects)

        if not sort_columns:
            sort_columns = ['-created_at']

        try:
            department_data = department_data.order_by(*sort_columns)
        except FieldError as e:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['department_data_not_found'],
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        department_data_page = department_data[offset:offset + limit]

        if department_data_page:
            department_serialized_data = DepartmentSerializer(department_data_page, many=True).data

            response_data.update({
                'status': 'success',
                'data': department_serialized_data,
                'message': SUCCESS_MESSAGES['department_data_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['department_data_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request, format=None):
        if not has_custom_perm(request.user, 'department_app.add_department'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        department_data = request.data

        try:
            serializer_instance = DepartmentSerializer(data=department_data)
            if serializer_instance.is_valid():
                serializer_instance.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer_instance.data,
                    'message': SUCCESS_MESSAGES['department_saved_success'],
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
        if not has_custom_perm(request.user, 'department_app.change_department'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        department_data = request.data
        print(request.data)
        try:
            department_instance = Department.objects.get(pk=pk)

            serializer_instance = DepartmentSerializer(
                instance=department_instance,
                data=department_data,
                partial=True
            )
            if serializer_instance.is_valid():
                serializer_instance.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer_instance.data,
                    'message': SUCCESS_MESSAGES['department_updated_success'],
                })
            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer_instance.errors
                })

        except Department.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': _("Department not found."),
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
        if not has_custom_perm(request.user, 'department_app.delete_department'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        response_data = get_response_template()
        department = get_object_or_404(Department, pk=pk)

        try:
            department.soft_delete()
            response_data.update({
                'status': 'success',
                'data': None,
                'message': _('Department deleted successfully.'),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': _('An error occurred while deleting the department.'),
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
