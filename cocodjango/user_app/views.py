# user_app/views.py

from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from profile_app.models import UserDetails
from .serializers import UserDetailsSerializer
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from rest_framework.exceptions import ValidationError
from utils import log_request, log_request_error, get_response_template
from auth_app.serializers import UserSerializer, ExtendedUserSerializer
from django.utils import translation
from django.db import transaction
from django.db.models.signals import post_save
from auth_app.signals import create_or_update_extended_user
from auth_app.models import ExtendedUser
from profile_app.models import UserDetails
from django.utils.html import strip_tags
from django.shortcuts import get_object_or_404
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
import secrets
from auth_app.serializers import PasswordResetConfirmSerializer, LoginSerializer, ExtendedUserSerializer, GroupSerializer
from django.contrib.auth.models import User, Group
from django.utils.translation import gettext
from django.utils.translation import gettext as _
import re
import os 
from common import emails
from common.base_models import CustomGroup
import random
import string
from django.http import QueryDict
from profile_app.models import UserDetails
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from utils import get_user_info
from utils import get_user_info_data, has_custom_perm
from django.utils.translation import gettext_lazy as _
from django.utils.translation import gettext_lazy
from common.models import UserTypeOptions
import subprocess
from django.conf import settings
from django.http import JsonResponse


def generate_random_password(length=12):
    """Generate a random password with letters, digits, and special characters."""
    all_characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choice(all_characters) for i in range(length))
    return password


def run_lexer_script(lexer_convert_path, file_path):
    try:
        process_python = subprocess.run(
            ['python', lexer_convert_path, file_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        python_output = process_python.stdout
        print("LexerConvert Output:", python_output)
        return python_output

    except subprocess.CalledProcessError as e:
        # Handle errors in running the lexer script
        print(f"Error running lexerConvert.py: {e.stderr}")
        return None

def run_racket_script(racket_module_path):

    directory_path = os.path.dirname(racket_module_path)
    print(f"Setting current working directory to: {directory_path}")

    try:
        process_racket = subprocess.run(
            ['/Applications/Racket v8.15/bin/racket', '-e', f'(begin (current-directory "{directory_path}") (require "writtenTestAdd.rkt"))'],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        racket_output = process_racket.stdout
        print("Racket Output:", racket_output)
        return racket_output

    except subprocess.CalledProcessError as e:
        # Handle errors in running the Racket script
        print(f"Error running Racket script: {e.stderr}")
        return None
    
def testRacket():
    # Paths to the required files
        file_path = os.path.join(settings.BASE_DIR, 'user_app', 'f', 'define_add.txt')
        lexer_convert_path = os.path.join(settings.BASE_DIR, 'user_app', 'f', 'lexerConvert.py')
        racket_module_path = os.path.join(settings.BASE_DIR, 'user_app', 'f', 'writtenTestAdd.rkt')

        # Print debugging information
        print("File Path for define_add.txt:", file_path)
        print("Lexer Convert Path:", lexer_convert_path)
        print("Racket Module Path:", racket_module_path)

        # First, run the lexer script
        python_output = run_lexer_script(lexer_convert_path, file_path)
        if not python_output:
            # If the lexer script fails, return an error response
            return JsonResponse({'error': 'Error running lexerConvert.py'}, status=500)

        # If lexer script ran successfully, proceed to run the Racket script
        racket_output = run_racket_script(racket_module_path)
        if not racket_output:
            # If the Racket script fails, return an error response
            return JsonResponse({'error': 'Error running Racket script'}, status=500)

        # Return the results as a JSON response
        return JsonResponse({
            'python_output': python_output,
            'racket_output': racket_output,
        })
        

class UserDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        
        if not has_custom_perm(request.user, 'auth.view_user'):
            return Response({'message': gettext_lazy('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        response_data = {'status': 'error'}
        
        user_data = get_user_info_data(request.user)
        organization_id = user_data["organization"]["id"] if user_data["organization"] else None
        
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 50))
        
        faculty_members = int(request.GET.get('faculty', 0))

        user_details = UserDetails.objects.select_related(
            'user',
            'current_state_province',
            'permanent_state_province'
        ).prefetch_related(
            'department',
            'campus',
            'college',
            'organization'
        ).filter(
            Q(department__isnull=False) |
            Q(campus__isnull=False) |
            Q(college__isnull=False) |
            Q(organization__isnull=False)
        )
        
        
        if faculty_members == 1:
            faculty_user_types = UserTypeOptions.get_faculty_user_type_options()
            user_details = user_details.filter(
                organization__isnull=False,
                user_type__in=faculty_user_types
            )
        
        if organization_id:
            user_details = user_details.filter(organization__id=organization_id)
        elif 'roles' in user_data and user_data['roles']:
            pass
        else:
            response_data.update({
                'status': 'error',
                'message': 'Bad request was sent.',
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_details = user_details.order_by(
                '-created_at')[offset:offset + limit]
        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': GLOBAL_ERROR_MESSAGES['data_fetch_error'],
                'error_code': 'BAD_REQUEST',
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        if user_details:
            serialized_data = UserDetailsSerializer(
                user_details, many=True).data
            response_data.update({
                'status': 'success',
                'data': serialized_data,
                'message': 'User details fetched successfully.'
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            response_data.update({
                'status': 'error',
                'message': 'No users found.',
                'error_code': 'RESOURCE_NOT_FOUND'
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, format=None):
        if not has_custom_perm(request.user, 'auth.add_user'):
            return Response({'message': gettext_lazy('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        log_request("POST", "EducationalOrganizationView", request)

        # Default response setup
        status_code = status.HTTP_201_CREATED  # Default status for successful creation
        response_data = get_response_template()

        # Make request.data mutable by copying it
        if isinstance(request.data, QueryDict):
            request_data_mutable = request.data.copy()  # Create a mutable copy
        else:
            request_data_mutable = request.data

        # Check if password is in request data, if not, generate a random password
        if 'password' not in request_data_mutable or not request_data_mutable.get('password'):
            generated_password = generate_random_password()
            request_data_mutable['password'] = generated_password

        # Serialize user data
        user_serializer = UserSerializer(data=request_data_mutable)
        if user_serializer.is_valid():
            with transaction.atomic():
                # Save the user instance
                validated_data = user_serializer.validated_data
                validated_data['is_active'] = False
                post_save.disconnect(
                    create_or_update_extended_user, sender=User)
                user = user_serializer.save()
                post_save.connect(create_or_update_extended_user, sender=User)

                # Create ExtendedUser instance
                extended_user_data = {
                    'user': user,
                    'middle_name': request_data_mutable.get('middle_name')
                }
                extended_user_serializer = ExtendedUserSerializer(
                    data=extended_user_data)

                if extended_user_serializer.is_valid():
                    ExtendedUser.objects.create(
                        user=user, middle_name=request_data_mutable.get('middle_name'))
                else:
                    transaction.set_rollback(True)
                    status_code = status.HTTP_400_BAD_REQUEST
                    error_messages = {}
                    for field, errors_list in extended_user_serializer.errors.items():
                        error_messages[field] = [
                            str(error) for error in errors_list]
                    response_data.update({
                        'status': 'error',
                        'message': error_messages,
                        'error_code': 'EXTENDED_USER_ERROR',
                    })

                if status_code == status.HTTP_201_CREATED:
                    # Create UserDetails instance
                    user_details_data = {
                        'organization_id': request_data_mutable.get('educational_organization'),
                        'campus_id': request_data_mutable.get('campus'),
                        'college_id': request_data_mutable.get('college'),
                        'department_id': request_data_mutable.get('department'),
                        'user_type': request_data_mutable.get('user_type')
                    }
                    user_details = UserDetails.objects.create(
                        user=user, **user_details_data)

                    # Validate and associate custom group with user if provided
                    custom_group_name = request_data_mutable.get('group')
                    if custom_group_name:
                        try:
                            custom_group = CustomGroup.objects.get(
                                id=custom_group_name)
                            user_details.custom_groups.add(custom_group)
                        except CustomGroup.DoesNotExist:
                            transaction.set_rollback(True)
                            status_code = status.HTTP_400_BAD_REQUEST
                            response_data.update({
                                'status': 'error',
                                'message': 'Custom group not found',
                                'error_code': 'CUSTOM_GROUP_NOT_FOUND',
                            })

            if status_code == status.HTTP_201_CREATED:
                # Generate activation link and send welcome email
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                activation_link = f"{os.getenv('FRONTEND_DOMAIN_URL')}/signup/activate?uidb64={uidb64}&token={token}"

                try:
                    emails.send_welcome_email_with_password(user, activation_link, generated_password)
                except Exception as e:
                    response_data.update({
                        'status': 'warning',
                        'message': gettext('User created successfully but failed to send welcome email'),
                    })
                    status_code = status.HTTP_201_CREATED
                    
                    
                user_details_data = UserDetails.objects.select_related(
                    'user',
                    'current_state_province',
                    'permanent_state_province'
                ).prefetch_related(
                    'department',
                    'campus',
                    'college',
                    'organization'
                ).get(pk=user_details.id)

                # Use the serializer to convert the user_details instance into a dictionary
                user_details_serialized = UserDetailsSerializer(user_details_data).data

                # Prepare the response data structure similar to the desired object
                response_data.update({
                    'status': 'success',
                    'message': gettext('User created successfully'),
                    'data': user_details_serialized
                })

        else:
            # Handle UserSerializer errors
            status_code = status.HTTP_400_BAD_REQUEST
            error_messages = {}
            for field, errors_list in user_serializer.errors.items():
                error_messages[field] = [str(error) for error in errors_list]
            response_data.update({
                'status': 'error',
                'message': error_messages,
                'error_code': 'USER_SERIALIZER_ERROR',
            })

        # Final return statement
        return Response(response_data, status=status_code)

    def put(self, request, pk, format=None):
        if not has_custom_perm(request.user, 'auth.change_user'):
            return Response({'message': gettext_lazy('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        log_request("PUT", "EducationalOrganizationView", request)
        user_details_id = pk
        # Default response setup
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        # Make request.data mutable by copying it
        if isinstance(request.data, QueryDict):
            request_data_mutable = request.data.copy()  # Create a mutable copy
        else:
            request_data_mutable = request.data

        # Fetch user details using pk
        if pk:
            user_details = get_object_or_404(UserDetails, id=pk)
            if user_details.user_id:
                pk = user_details.user_id
            else:
                status_code = status.HTTP_404_NOT_FOUND
                response_data.update({
                    'status': 'error',
                    'message': _("User not found."),
                    'error_code': 'NOT_FOUND',
                })
        else:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': _("User not found."),
                'error_code': 'NOT_FOUND',
            })

        if status_code == status.HTTP_200_OK:
            # Fetch the user instance to update
            try:
                user = User.objects.get(pk=pk)
            except User.DoesNotExist:
                status_code = status.HTTP_404_NOT_FOUND
                response_data.update({
                    'status': 'error',
                    'message': _("User not found."),
                    'error_code': 'NOT_FOUND',
                })

        if status_code == status.HTTP_200_OK:
            # We don't need to handle password for PUT, so remove it from the data
            request_data_mutable.pop('password', None)

            user_serializer = UserSerializer(
                user, data=request_data_mutable, partial=True)

            if user_serializer.is_valid():
                with transaction.atomic():
                    user = user_serializer.save()

                    # Update ExtendedUser instance
                    extended_user_data = {
                        'middle_name': request_data_mutable.get('middle_name')}
                    extended_user_serializer = ExtendedUserSerializer(
                        user.extendeduser, data=extended_user_data, partial=True)

                    if extended_user_serializer.is_valid():
                        extended_user_serializer.save()
                    else:
                        transaction.set_rollback(True)
                        status_code = status.HTTP_400_BAD_REQUEST
                        response_data.update({
                            'status': 'error',
                            'message': extended_user_serializer.errors,
                            'error_code': 'EXTENDED_USER_ERROR',
                        })

                    if status_code == status.HTTP_200_OK:
                        # Update UserDetails instance
                        user_details_data = {
                            'organization_id': request_data_mutable.get('educational_organization'),
                            'campus_id': request_data_mutable.get('campus'),
                            'college_id': request_data_mutable.get('college'),
                            'department_id': request_data_mutable.get('department'),
                            'user_type': request_data_mutable.get('user_type')
                        }
                        UserDetails.objects.filter(
                            user=user).update(**user_details_data)

                        # Validate and update custom group if provided
                        custom_group_name = request_data_mutable.get('group')
                        if custom_group_name:
                            try:
                                custom_group = CustomGroup.objects.get(
                                    id=custom_group_name)
                                user.userdetails.custom_groups.clear()
                                user.userdetails.custom_groups.add(
                                    custom_group)
                            except CustomGroup.DoesNotExist:
                                transaction.set_rollback(True)
                                status_code = status.HTTP_400_BAD_REQUEST
                                response_data.update({
                                    'status': 'error',
                                    'message': 'Custom group not found',
                                    'error_code': 'CUSTOM_GROUP_NOT_FOUND',
                                })
            else:
                # Handle UserSerializer errors
                status_code = status.HTTP_400_BAD_REQUEST
                error_messages = {}
                for field, errors_list in user_serializer.errors.items():
                    error_messages[field] = [str(error)
                                             for error in errors_list]
                response_data.update({
                    'status': 'error',
                    'message': error_messages,
                    'error_code': 'USER_SERIALIZER_ERROR',
                })

        # Final return statement

        if status_code == status.HTTP_200_OK:

            user_details_data = UserDetails.objects.select_related(
                'user',
                'current_state_province',
                'permanent_state_province'
            ).prefetch_related(
                'department',
                'campus',
                'college',
                'organization'
            ).get(pk=user_details_id)

            user_details_serialized = UserDetailsSerializer(user_details_data).data

            response_data.update({
                'status': 'success',
                'data': user_details_serialized,
                'message': SUCCESS_MESSAGES['user_updated_success'],
            })

        return Response(response_data, status=status_code)

    @transaction.atomic
    def delete(self, request, pk, format=None):

        response_data = get_response_template()
        response_data.update({
            'status': 'success',
            'data': None,
            'message': 'User is deleted successfully.',
        })
        return Response(response_data, status=status.HTTP_204_NO_CONTENT)