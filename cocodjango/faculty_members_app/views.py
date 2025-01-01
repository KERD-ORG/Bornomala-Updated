from django.core.exceptions import FieldError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from global_messages import SUCCESS_MESSAGES as GLOBAL_ERROR_MESSAGES
from utils import get_response_template
from .messages import *
from .models import FacultyMembers
from .serializers import FacultyMembersSerializer
from auth_app.serializers import UserSerializer
from django.contrib.auth.models import User
from django_countries import countries

from rest_framework.permissions import BasePermission, IsAuthenticated

class OwnProfilePermission(BasePermission):
    """
    Object-level permission to only allow editing of own profile.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class FacultyMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        if 'users' in request.GET:
            return self.get_users(request)

        response_data = get_response_template()
        
        if not request.user.has_perm('faculty_members_app.view_any_facultymember') and not request.user.has_perm(
                'faculty_members_app.view_own_facultymember'):
            return Response({"message": "You do not have permission to view any faculty member data."},
                            status=status.HTTP_403_FORBIDDEN)

        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 50))
        sort_columns_param = request.GET.get('sortColumns', '')
        sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else []
        search_term = request.GET.get('searchTerm', '')

        if request.user.has_perm('faculty_members_app.view_any_facultymember'):
            faculty_members_data = FacultyMembers.objects.all()
        else:
            # User can only view their own profile, filter by user
            faculty_members_data = FacultyMembers.objects.filter(user=request.user)

        if search_term:
            q_objects = Q(user__username__icontains=search_term) | \
                        Q(personal_web_address__icontains=search_term) | \
                        Q(research_profile_address__icontains=search_term) | \
                        Q(statement__icontains=search_term) | \
                        Q(faculty_type__icontains=search_term)
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
                educational_organization__name__icontains=search_term
            ) | Q(
                state_province__name__icontains=search_term
            ) | Q(
                country_code__in=country_codes
            )
            faculty_members_data = faculty_members_data.filter(q_objects)

        if not sort_columns:
            sort_columns = ['-created_at']

        try:
            faculty_members_data = faculty_members_data.order_by(*sort_columns)
        except FieldError:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['data_not_found'],
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        faculty_members_data_page = faculty_members_data[offset:offset + limit]

        if faculty_members_data_page:
            faculty_members_serialized_data = FacultyMembersSerializer(faculty_members_data_page, many=True).data
            response_data.update({
                'status': 'success',
                'data': faculty_members_serialized_data,
                'message': SUCCESS_MESSAGES['data_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['data_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    def get_users(self, request):
        if request.user.has_perm('faculty_members_app.view_any_user'):
            users = User.objects.all()
        elif request.user.has_perm('faculty_members_app.view_own_user'):
            users = User.objects.filter(id=request.user.id)
        else:
            return Response({"message": "You do not have permission to view users."}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request, format=None):
        response_data = get_response_template()
        faculty_member_data = request.data

        if request.user.has_perm('faculty_members_app.change_any_facultymember') or (
                request.user.has_perm('faculty_members_app.change_own_facultymember') and faculty_member.user == request.user):

            serializer = FacultyMembersSerializer(data=faculty_member_data)
            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': SUCCESS_MESSAGES['saved_successfully'],
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
        else:
            return Response({"message": "You do not have permission to add this faculty member."}, status=status.HTTP_403_FORBIDDEN)



    @transaction.atomic
    def put(self, request, pk, format=None):
        faculty_member = get_object_or_404(FacultyMembers, pk=pk)
        if request.user.has_perm('faculty_members_app.change_any_facultymember') or (request.user.has_perm('faculty_members_app.change_own_facultymember') and faculty_member.user == request.user):
            response_data = get_response_template()
            serializer = FacultyMembersSerializer(faculty_member, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': SUCCESS_MESSAGES['updated_successfully'],
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
        else:
            return Response({"message": "You do not have permission to edit this faculty member."}, status=status.HTTP_403_FORBIDDEN)

    @transaction.atomic
    def delete(self, request, pk, format=None):
        faculty_member = get_object_or_404(FacultyMembers, pk=pk)
        if request.user.has_perm('faculty_members_app.delete_any_facultymember') or (request.user.has_perm('faculty_members_app.delete_own_facultymember') and faculty_member.user == request.user):
            faculty_member.soft_delete()  # Assuming soft_delete method is defined in the model
            response_data = get_response_template()
            response_data.update({
                'status': 'success',
                'data': None,
                'message': gettext_lazy('Faculty member deleted successfully.'),
            })
            return Response(response_data, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({"message": "You do not have permission to delete this faculty member."}, status=status.HTTP_403_FORBIDDEN)




