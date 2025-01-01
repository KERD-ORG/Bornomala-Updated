from django.core.exceptions import FieldError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Q
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from django.shortcuts import get_object_or_404

from utils import get_response_template
from .messages import *
from .models import College
from .serializers import CollegeSerializer
from django_countries import countries
from utils import get_user_info_data, has_custom_perm


class CollegeView(APIView):

    def get(self, request, format=None):               
        if not has_custom_perm(request.user, 'college_app.view_college'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        response_data = get_response_template()

        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 50))
        sort_columns_param = request.GET.get('sortColumns', '')
        sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else []
        search_term = request.GET.get('searchTerm', '')

        college_data = College.objects.all()
        
        user_data = get_user_info_data(request.user)
        organization_id = user_data["organization"]["id"] if user_data["organization"] else None
        if organization_id:
            college_data = college_data.filter(campus__educational_organization__id=organization_id)
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
            q_objects = Q(name__icontains=search_term) | \
                        Q(web_address__icontains=search_term) | \
                        Q(statement__icontains=search_term)
            
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
            college_data = college_data.filter(q_objects)

        if not sort_columns:
            sort_columns = ['-created_at']

        try:
            college_data = college_data.order_by(*sort_columns)
        except FieldError:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['college_data_not_found'],
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        college_data_page = college_data[offset:offset + limit]

        if college_data_page:
            college_serialized_data = CollegeSerializer(college_data_page, many=True).data
            response_data.update({
                'status': 'success',
                'data': college_serialized_data,
                'message': SUCCESS_MESSAGES['college_data_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['college_data_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request, format=None):
        if not has_custom_perm(request.user, 'college_app.add_college'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)

        response_data = get_response_template()
        college_data = request.data

        serializer = CollegeSerializer(data=college_data)
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': SUCCESS_MESSAGES['college_saved_successfully'],
            })
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            response_data.update({
                'status': 'error',
                'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                'error_code': 'VALIDATION_ERROR',
                'details': serializer.errors
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, pk, format=None):
        if not has_custom_perm(request.user, 'college_app.change_college'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)

        response_data = get_response_template()
        college_instance = get_object_or_404(College, pk=pk)

        serializer = CollegeSerializer(college_instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': SUCCESS_MESSAGES['college_updated_successfully'],
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            response_data.update({
                'status': 'error',
                'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                'error_code': 'VALIDATION_ERROR',
                'details': serializer.errors
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk, format=None):
        if not has_custom_perm(request.user, 'college_app.delete_college'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)

        response_data = get_response_template()
        college = get_object_or_404(College, pk=pk)

        college.soft_delete()
        response_data.update({
            'status': 'success',
            'data': None,
            'message': gettext_lazy('College deleted successfully.'),
        })
        return Response(response_data, status=status.HTTP_204_NO_CONTENT)
