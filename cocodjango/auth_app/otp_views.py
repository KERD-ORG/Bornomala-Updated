# otp_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from .models import UserOTP
from .models import User
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.translation import gettext
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from django.core.mail import send_mail
from history_metadata import (
    OTP_HISTORY_TYPE, 
    generate_otp_setup_reason,
    generate_otp_disable_reason,
    generate_otp_verify_reason
)
from simple_history.utils import update_change_reason
from common import emails
import pyotp
import os
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


@swagger_auto_schema(
    operation_summary="Setup OTP for User.",
    operation_description="Sets up OTP (One-Time Password) for the authenticated user. Generates an OTP URI for authentication setup.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=[],
        properties={
            'token': openapi.Schema(type=openapi.TYPE_STRING, description='OTP token'),
        },
    ),
    method='post',
    responses={
        200: "OTP setup successful. Returns OTP URI.",
        400: "Bad request. OTP is already set up or other errors.",
    }
)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_otp(request):
    user = request.user
    # Try to get an existing UserOTP instance for the user
    try:
        user_otp = UserOTP.objects.get(user=user)
    except UserOTP.DoesNotExist:
        # If the instance doesn't exist, create a new one
        otp_secret = pyotp.random_base32()
        user_otp = UserOTP()
        user_otp.user = user
        user_otp.otp_secret = otp_secret
        user_otp._change_reason = generate_otp_setup_reason()
        user_otp.save()

    if not user_otp.otp_secret or not user_otp.verified:
        totp = pyotp.TOTP(user_otp.otp_secret)    
        otp_uri = totp.provisioning_uri(user.email, issuer_name=os.getenv('OPT_PLATFORM_NAME'))
        
        return Response({'otp_uri': otp_uri, 'message': gettext('OTP setup is successful! You can now set up OTP again.')}, status=200)
    else:
        return Response({'error': gettext('OTP is already set up and verified for this user')}, status=400)



@swagger_auto_schema(
    method='post',
    operation_summary="Verify OTP",
    operation_description="Verifies the OTP token provided by the user.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['token'],
        properties={
            'token': openapi.Schema(type=openapi.TYPE_STRING, description='OTP token'),
        },
        example={
            'token': '123456'
        }
    ),
    responses={
        200: "OTP verification successful.",
        400: "Bad request. OTP verification failed.",
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_otp(request):
    token = request.data.get('token')  # Use request.data for JSON payload
    user_otp = UserOTP.objects.get(user=request.user)
    totp = pyotp.TOTP(user_otp.otp_secret)
    
    if totp.verify(token):
        user_otp.verified = True  # Mark the OTP as verified
        user_otp._change_reason = generate_otp_verify_reason()
        user_otp.save()
        user =  User.objects.get(id=user_otp.user_id)
        emails.send_otp_activation_email(user)
        return JsonResponse({'verified': True, 'success': True, 'message': gettext('OTP verification successful! You can now use your OTP for secure login.')})
    return JsonResponse({'verified': False, 'message': gettext('The OTP code you entered is incorrect. Please try again.')}, status=400)


@swagger_auto_schema(
    method='post',
    operation_summary="Disable OTP",
    operation_description="Disables OTP for the authenticated user, removing the two-factor authentication requirement.",
    responses={
        200: "OTP disabled successfully.",
        404: "Not found. No OTP record found for the user.",
        500: "Internal server error.",
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_otp(request):
    try:
        # Get the OTP record associated with the authenticated user
        otp_record = UserOTP.objects.get(user=request.user)
        otp_record._change_reason = generate_otp_disable_reason()
        otp_record.delete()
        
        # Return a success message
        return Response({'success': True, 'message': gettext('OTP has been successfully disabled. Your account no longer requires two-factor authentication for login.')})
    except UserOTP.DoesNotExist:
        # If OTP record doesn't exist for the user
        return Response({'success': False, 'message': gettext('No OTP record found for the user.')}, status=404)
    except Exception as e:
        # Handle other exceptions
        return Response({'success': False, 'message': str(e)}, status=500)

@swagger_auto_schema(
    method='get',
    operation_summary="Check OTP Setup Status",
    operation_description="Determines if OTP setup is complete and provides the OTP URI if available.",
    responses={
        200: "Success. Returns OTP setup status and OTP URI if available.",
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_otp_setup(request):
    user = request.user
    user_otp = UserOTP.objects.filter(user=request.user).exists()
    if not user_otp:
        return JsonResponse({'otp_setup': False})
    else:
        # Check if OTP is verified
        user_otp_instance = UserOTP.objects.get(user=request.user)
        verified = user_otp_instance.verified
        otp_uri = None
        if not verified:
            # Generate OTP URI from existing secret if OTP is not verified
            otp_secret = user_otp_instance.otp_secret
            totp = pyotp.TOTP(otp_secret)
            otp_uri = totp.provisioning_uri(user.email, issuer_name=os.getenv('OPT_PLATFORM_NAME'))
        return JsonResponse({'otp_setup': True, 'verified': verified, 'otp_uri': otp_uri})

def verify_otp_token(user,otp):
    user_otp = UserOTP.objects.get(user=user)
    totp = pyotp.TOTP(user_otp.otp_secret)
    if totp.verify(otp):
        return True
    
    return False

