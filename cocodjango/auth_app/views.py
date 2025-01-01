from ipaddress import ip_address
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from django.contrib.auth.models import User, Group
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import Permission
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.shortcuts import get_object_or_404
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
import secrets
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from .models import PasswordResetToken
from .serializers import PasswordResetConfirmSerializer, LoginSerializer, ExtendedUserSerializer, GroupSerializer
from django.db import transaction
from django.urls import reverse
from django.utils.encoding import force_str
from .models import UserOTP
from django.utils.translation import gettext_lazy
import requests
from django.utils import translation
from django.utils.translation import gettext
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from django.db.models.signals import post_save
from .signals import create_or_update_extended_user
from .models import ExtendedUser
from profile_app.models import UserDetails
from common import emails
import re
import os
from defender.decorators import watch_login
from django.utils.decorators import method_decorator
from defender.utils import is_source_ip_already_locked
from django.db.utils import DataError
from common.base_models import CustomGroup
from django.db.models import Q 
from utils import get_user_info_data


from .otp_views import setup_otp, verify_otp, disable_otp, check_otp_setup, verify_otp_token

from history_metadata import (
    generate_registration_reason,
    generate_user_activate_reason,
    generate_password_reset_token_generation_reason,
    generate_password_reset_confirm_reason,
    generate_role_assignment_reason,
    generate_user_login_failed,
    generate_otp_verification_fail_reason,
    generate_user_login,
    generate_user_logout

)
from simple_history.utils import update_change_reason
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.contrib.auth import authenticate, login


@swagger_auto_schema(
    method='get',
    operation_summary="List Roles",
    operation_description="Retrieve a list of all available roles.",
    responses={200: "Roles retrieved successfully.", 404: "No roles found."}
)
@api_view(['GET'])
def list_roles(request):
    roles = list(Group.objects.all().values_list('name', flat=True))
    if roles:
        return Response({"roles": roles}, status=status.HTTP_200_OK)
    else:
        return Response({"detail": "No roles found."}, status=status.HTTP_404_NOT_FOUND)


@swagger_auto_schema(
    method='post',
    request_body=UserSerializer,
    responses={201: 'User created successfully', 400: 'Bad Request'}
)
@api_view(['POST'])
def register(request):
    # Validate reCAPTCHA token
    g_reCaptcha_token = request.data.get('gRecaptchaToken')
    if not g_reCaptcha_token:
        return Response({'error': ERROR_MESSAGES['missing_recaptcha_token']}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify reCAPTCHA
    recaptcha_data = {
        'response': g_reCaptcha_token,
        'secret': os.getenv('RECAPTCHA_SECRET_KEY')
    }
    recaptcha_response = requests.post(
        os.getenv('RECAPTCHA_SITE_VERIFICATION_URL'), data=recaptcha_data)
    recaptcha_result = recaptcha_response.json()

    if not recaptcha_result.get('success') or recaptcha_result.get('score', 0) < float(os.getenv('RECAPTCHA_SITE_SCORE')):
        return Response({'error': ERROR_MESSAGES['failed_recaptcha_verification']}, status=status.HTTP_400_BAD_REQUEST)

    # Validate UserSerializer for user registration
    user_serializer = UserSerializer(data=request.data)
    if user_serializer.is_valid():
        with transaction.atomic():
            validated_data = user_serializer.validated_data
            validated_data['is_active'] = False
            post_save.disconnect(create_or_update_extended_user, sender=User)
            user = user_serializer.save()
            post_save.connect(create_or_update_extended_user, sender=User)
            
            # Create ExtendedUser instance
            extended_user_data = {
                'user': user,
                'middle_name': request.data.get('middle_name')
            }
            extended_user_serializer = ExtendedUserSerializer(data=extended_user_data)
            if extended_user_serializer.is_valid():
                ExtendedUser.objects.create(
                user=user, middle_name=request.data.get('middle_name'))
            else:
                transaction.set_rollback(True)
                error_messages = {}
                for field, errors_list in extended_user_serializer.errors.items():
                    error_messages[field] = [str(error) for error in errors_list]
                return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)

            # Create UserDetails instance
            UserDetails.objects.create(user=user)

            # Validate and associate role with user if provided
            role = request.data.get('role')
            if role:
                # Validate role using GroupSerializer
                role_serializer = GroupSerializer(data={'role': role})
                if role_serializer.is_valid():
                    group_name = role_serializer.validated_data['role']
                    group, _ = Group.objects.get_or_create(name=group_name)
                    group.user_set.add(user)
                else:
                    transaction.set_rollback(True)
                    # Handle role validation errors
                    error_messages = role_serializer.errors
                    return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)

        # Generate activation link and send welcome email
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        activation_link = f"{os.getenv('FRONTEND_DOMAIN_URL')}/signup/activate?uidb64={uidb64}&token={token}"
        try:
            emails.send_welcome_email(user, activation_link)
        except Exception as e:
            return Response({'message': gettext('User created successfully but failed to send welcome email')}, status=status.HTTP_201_CREATED)

        return Response({'message': gettext('User created successfully')}, status=status.HTTP_201_CREATED)

    # Handle UserSerializer errors
    error_messages = {}
    for field, errors_list in user_serializer.errors.items():
        error_messages[field] = [str(error) for error in errors_list]
    return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method='post',
    operation_summary="Activate User Account",
    operation_description="Activates the user account using the provided activation token.",
    manual_parameters=[
        openapi.Parameter(
            'uidb64',
            openapi.IN_PATH,
            description="The base64 encoded user ID.",
            type=openapi.TYPE_STRING,
            required=True,
            example='Mw'
        ),
        openapi.Parameter(
            'token',
            openapi.IN_PATH,
            description="The activation token.",
            type=openapi.TYPE_STRING,
            required=True,
            example='c8cd3s-2be467025baf32e13c5e927a57669330'
        )
    ],
    responses={
        200: openapi.Response(
            description="Your account has been activated successfully."
        ),
        400: openapi.Response(
            description="Activation link is invalid or expired.",
        ),
    }
)
@api_view(['POST'])
def activate_account(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user._change_reason = generate_user_activate_reason()
        user.save()
        return Response({'message': gettext_lazy('Your account has been activated successfully.')}, status=status.HTTP_200_OK)
    else:
        return Response({'message': gettext_lazy('Activation link is invalid or expired.')}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):

    @staticmethod
    def get_user(identifier):
        """
        Get the user object by either username or email.
        """
        # Try to fetch the user by username
        try:
            user = User.objects.get(username=identifier)
            return user
        except User.DoesNotExist:
            pass

        # Try to fetch the user by email
        try:
            user = User.objects.get(email=identifier)
            return user
        except User.DoesNotExist:
            pass

        # If the user does not exist with either username or email, return None
        return None

    @swagger_auto_schema(
        operation_summary="User Login",
        operation_description="Logs in a user with a username, password, and optionally a one-time password (OTP). Returns authentication token and user details if successful.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['username', 'password'],
            properties={
                'username': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Username',
                    example='newtesti'  # Predefined example value
                ),
                'password': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Password',
                    example='123456781@'  # Predefined example value
                ),
                'otp': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='One-time password',
                    example='123456'  # Predefined example value
                ),
            },
        ),
        responses={
            200: "Login successful. Returns token and user details.",
            400: "Bad request. Invalid input data or missing credentials.",
            401: "Unauthorized. Invalid username/email or password.",
            403: "Account locked due to too many failed login attempts",
        }
    )
    @transaction.atomic
    #@method_decorator(watch_login())
    def post(self, request, format=None):
        serializer = LoginSerializer(data=request.data)

        # Validate the serializer data
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.post = watch_login()(self.post)

        identifier = serializer.validated_data.get('username')
        password = serializer.validated_data.get('password')
        otp = serializer.validated_data.get('otp', '')
        otp_user = ''

        try:
            # Try to authenticate with the given identifier
            user = authenticate(request, username=identifier, password=password)

            if user is None:
                try:
                    # Check if the identifier is an email
                    user_by_email = User.objects.get(email=identifier)
                    otp_user = user_by_email
                    # Try to authenticate again using the username associated with the email
                    user = authenticate(request, username=user_by_email.username, password=password)
                except User.DoesNotExist:
                    pass
            else:
                otp_user = User.objects.get(username=identifier)

            if user is not None:
                otp_entry = UserOTP.objects.filter(user=otp_user).first()

                if otp_entry and otp_entry.verified:
                    # User has OTP setup
                    if otp:
                        # OTP provided, verify it
                        if verify_otp_token(otp_user, otp):
                            # OTP verification successful, perform login
                            login(request, user)
                            update_change_reason(user, generate_user_login())
                            token, _ = Token.objects.get_or_create(user=user)
                            return Response({
                                'token': token.key,
                                **UserSerializer(user).data,
                            }, status=status.HTTP_200_OK)
                        else:
                            update_change_reason(user, generate_otp_verification_fail_reason())
                            # OTP verification failed
                            return Response({"detail": ERROR_MESSAGES['otp_incorrect']}, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        # OTP not provided, soft login required
                        return Response({'soft_login_required': True})
                else:
                    # User does not have OTP setup, perform regular login
                    login(request, user)
                    update_change_reason(user, generate_user_login())
                    token, _ = Token.objects.get_or_create(user=user)
                    return Response({
                        'token': token.key,
                        **UserSerializer(user).data,
                    }, status=status.HTTP_200_OK)

            else:
                user = self.get_user(identifier)
                if user is not None:
                    update_change_reason(user, generate_user_login_failed())

            email_regex = re.compile(r'^\S+@\S+\.\S+$')
            is_email = email_regex.match(identifier) is not None
            if is_email:
                message = ERROR_MESSAGES['invalid_credentials_email']
            else:
                message = ERROR_MESSAGES['invalid_credentials_username']

            return Response({"detail": message}, status=status.HTTP_401_UNAUTHORIZED)

        except DataError as e:
            return Response({"detail": gettext_lazy("Data too long for field. Please ensure your username or email is within the valid length.")}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def lockout_response(request, username=None):
    response_data = {
        'status': 'locked',
        'detail': ERROR_MESSAGES['Account locked due to too many failed login attempts.']
    }
    return Response(response_data, status=403)

@api_view(['GET'])
def check_ip_block(request):
    ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
    if not ip_address:
        ip_address = request.META.get('REMOTE_ADDR')
    if is_source_ip_already_locked(ip_address):
        response_data = {
            'status': 'locked',
            'detail': ERROR_MESSAGES['Account locked due to too many failed login attempts.']
        }
        return Response(response_data, status=403)
    else :
        return Response({"detail":"you got to go"}, status=200)


@swagger_auto_schema(
    method='get',
    operation_summary="Retrieve Authenticated User Information.",
    operation_description="Fetch details about the currently authenticated user.",
    responses={200: "User information retrieved successfully.",
               401: "Unauthorized"}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user_data = get_user_info_data(request.user)  # Call the utility function
    return Response(user_data)


@swagger_auto_schema(
    method='post',
    operation_summary="Logout User",
    operation_description="Logs out the currently authenticated user by deleting their authentication token.",
    responses={
        200: openapi.Response(
            description="Successfully logged out."
        ),
        401: openapi.Response(
            description="Unauthorized"
        )
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # This retrieves the token for the currently authenticated user and deletes it
    request.user.auth_token.delete()
    update_change_reason(request.user, generate_user_logout())
    return Response({"detail": "Successfully logged out."}, status=200)


@swagger_auto_schema(
    method='get',
    operation_summary="Retrieve User Permissions.",
    operation_description="Fetches the permissions assigned directly or through groups to the authenticated user.",
    responses={200: "User permissions retrieved successfully.",
               401: "Unauthorized"}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permissions(request):
    user = request.user

    # Retrieve direct permissions for the current user
    direct_permissions = Permission.objects.filter(user=user).distinct()

    # Retrieve permissions for the current user through their standard groups
    group_permissions = Permission.objects.filter(group__user=user).distinct()

    # Retrieve all custom groups that the user is a member of
    # This assumes you have a UserDetails model linked to CustomGroup
    custom_groups = user.userdetails.custom_groups.all()  # Adjust according to your user model's relation

    # Retrieve permissions from custom groups
    custom_group_permissions = Permission.objects.filter(
        customgroup__in=custom_groups
    ).distinct()

    # Combine all permissions (direct, group-based, and custom group-based)
    all_permissions = (direct_permissions | group_permissions | custom_group_permissions).distinct()

    # Serialize the permissions
    permissions_data = [{"codename": perm.codename, "permission_name": perm.name} for perm in all_permissions]

    return JsonResponse(permissions_data, safe=False)

@swagger_auto_schema(
    method='post',
    operation_summary="Validate Password Reset Token",
    operation_description="Validates the password reset token. Returns success if the token is valid, otherwise returns an error.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'token': openapi.Schema(type=openapi.TYPE_STRING, description="Password reset token")
        },
        required=['token']
    ),
    responses={200: "Token is valid.", 400: "Bad Request"}
)
@api_view(['POST'])
def validate_password_reset_token(request):
    token = request.data.get('token')
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = validate_reset_token(token)
    if user:
        return Response({'message': 'Token is valid'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method='post',
    operation_summary="Request Password Reset",
    operation_description="Sends a password reset link to the provided email address if the user exists.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'email': openapi.Schema(type=openapi.TYPE_STRING, description="User email")
        },
        required=['email']
    ),
    responses={200: "Password reset link sent.", 400: "Bad Request"}
)
@api_view(['POST'])
def request_password_reset(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    user = get_object_or_404(User, email=email)
    token = generate_reset_token(user)
    emails.send_reset_email(user, token)

    return Response({"message": "Password reset link sent"}, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method='post',
    operation_summary="Reset Password",
    operation_description="Resets the user's password using the provided password reset token and new password.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['password', 'confirm_password', 'token'],
        properties={
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='New password'),
            'confirm_password': openapi.Schema(type=openapi.TYPE_STRING, description='Confirm new password'),
            'token': openapi.Schema(type=openapi.TYPE_STRING, description='Password reset token')
        },
    ),
    responses={200: "Password reset successful.", 400: "Bad Request"}
)
@api_view(['POST'])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)

    if serializer.is_valid():
        password_reset_confirm = serializer.save()
        update_change_reason(password_reset_confirm,
                             generate_password_reset_confirm_reason())
        return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)

    error_messages = {}
    for field, errors_list in serializer.errors.items():
        translated_errors = []
        for error in errors_list:
            translated_error = ERROR_MESSAGES.get(error, gettext(error))
            if error == 'This password is too short. It must contain at least 8 characters.':
                translated_error = f"{ERROR_MESSAGES['This password is too short.']} {ERROR_MESSAGES['It must contain at least 8 characters.']}"
            translated_errors.append(translated_error)
        error_messages[field] = translated_errors

    return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)


def generate_reset_token(user):
    token = default_token_generator.make_token(user)
    expiry_time = timezone.now() + \
        timezone.timedelta(hours=int(os.getenv('REST_PASSWORD_EXPIRE_TIME')))
    with transaction.atomic():
        password_reset_token = PasswordResetToken.objects.create(
            user=user, token=token, expiry_time=expiry_time)
        update_change_reason(password_reset_token,
                             generate_password_reset_token_generation_reason())
    return token


def validate_reset_token(token):
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return None

    if reset_token.expiry_time < timezone.now():
        return None

    user = reset_token.user
    if not default_token_generator.check_token(user, token):
        return None

    return user



def send_reset_email(user, token):
    reset_link = f"{os.getenv('FRONTEND_DOMAIN_URL')}/reset_password?token={token}"
    subject = gettext('Password Reset Requested')
    # subject = 'Password Reset Requested'
    message = render_to_string('password_reset_email.html', {
                               'user': user, 'reset_link': reset_link})
    plain_message = strip_tags(message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    send_mail(subject, plain_message, from_email,
              [user.email], html_message=message)


def generate_unique_token():
    token_length = 20  # length of token
    return secrets.token_urlsafe(token_length)
