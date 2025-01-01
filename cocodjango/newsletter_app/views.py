import os

from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import *


# Create your views here.
@api_view(['POST'])
def subscribe_to_newsletter(request):
    email = request.data.get('email', None)
    if email:
        try:
            validate_email(email)
            serializer = NewsletterSubscriptionSerializer(data={'email': email})
            if serializer.is_valid():
                serializer.save()

                subject = 'Thank you for subscribing!'
                from_email = os.getenv('FROM_EMAIL_ADDRESS')
                html_message = render_to_string('newsletter_confirmation_email.html', {'email': email})
                plain_message = strip_tags(html_message)

                try:
                    send_mail(subject, plain_message, from_email, [email], html_message=html_message)
                    return Response({"message": "Subscription successful! Confirmation email sent."},
                                    status=status.HTTP_201_CREATED)
                except Exception as e:
                    return Response({"message": "Subscription successful but failed to send confirmation email."},
                                    status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError:
            return Response({"error": "Invalid email address"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"error": "Email address is required"}, status=status.HTTP_400_BAD_REQUEST)


