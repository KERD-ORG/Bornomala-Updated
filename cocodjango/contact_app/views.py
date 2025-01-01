from django.shortcuts import render
from rest_framework.generics import CreateAPIView
from .serializers import ContactUsSerializer
from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
import requests
import os
from .messages import SUCCESS_MESSAGES, ERROR_MESSAGES
from django.utils.translation import get_language

class ContactUsView(CreateAPIView):
    serializer_class = ContactUsSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        current_language = get_language()
        print(f"Current language: {current_language}")
        g_reCaptcha_token = request.data.get('gReCaptchaToken')
    
        if not g_reCaptcha_token:
            return Response({'error': ERROR_MESSAGES['missing_recaptcha_token']}, status=status.HTTP_400_BAD_REQUEST)

        recaptcha_data = {
            'response': g_reCaptcha_token,
            'secret': os.getenv('RECAPTCHA_SECRET_KEY')
        }

        recaptcha_response = requests.post(os.getenv('RECAPTCHA_SITE_VERIFICATION_URL'), data=recaptcha_data)
        recaptcha_result = recaptcha_response.json()

        # Check the reCAPTCHA score
        if not recaptcha_result.get('success') or recaptcha_result.get('score', 0) < float(os.getenv('RECAPTCHA_SITE_SCORE')):
            return Response({'error': ERROR_MESSAGES['failed_recaptcha_verification']}, status=status.HTTP_400_BAD_REQUEST)
       
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                instance = serializer.save()
                return Response({
                    "message": SUCCESS_MESSAGES['contact_us_saved_success'],
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                transaction.set_rollback(True)
                return Response({
                    "error": ERROR_MESSAGES['failed_save_contact_us_form_data'],
                    "details": str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "error": ERROR_MESSAGES['failed_save_contact_us_form_data'],
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
 