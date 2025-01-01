import logging
from typing import Any
from django.core.mail import EmailMultiAlternatives
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.translation import gettext
import os
from .messages import SUCCESS_MESSAGES, ERROR_MESSAGES, EMAIL_SUBJECTS
logger = logging.getLogger(__name__)


def send_contact_email_to_admin(requested_name="", requested_email="", message=""):
    admin_email = os.getenv('ADMIN_EMAIL')
    if not admin_email:
        return
    context = {
        "full_name": requested_name,
        "email": requested_email,
        "message": message,
    }
    subject = EMAIL_SUBJECTS['contact_email_subject']
    template = "contact_request.html"
    message = render_to_string(template, context)
    plain_message = strip_tags(message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    to_email = admin_email
    send_mail(subject, plain_message, from_email, [to_email], html_message=message)

def send_welcome_email(user, activation_link):
    subject = EMAIL_SUBJECTS["welcome_subject"]
    html_message = render_to_string('welcome_email.html', {'user': user, 'activation_link': activation_link})
    plain_message = strip_tags(html_message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    to = user.email
    send_mail(subject, plain_message, from_email, [to], html_message=html_message)
    
def send_welcome_email_with_password(user, activation_link, generated_password):
    subject = EMAIL_SUBJECTS["welcome_subject"]
    html_message = render_to_string('welcome_email_generated_password.html', {'user': user, 'activation_link': activation_link, 'generated_password': generated_password})
    plain_message = strip_tags(html_message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    to = user.email
    send_mail(subject, plain_message, from_email, [to], html_message=html_message)

def send_reset_email(user, token):
    reset_link = f"{os.getenv('FRONTEND_DOMAIN_URL')}/reset_password?token={token}"
    subject = EMAIL_SUBJECTS['password_reset_subject']
    #subject = 'Password Reset Requested'
    message = render_to_string('password_reset_email.html', {'user': user, 'reset_link': reset_link})
    plain_message = strip_tags(message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    send_mail(subject, plain_message, from_email, [user.email], html_message=message)

def send_otp_activation_email(user):
    subject = EMAIL_SUBJECTS['otp_activation_subject']
    html_message = render_to_string('otp_activation_email.html', {
        'user': user,
        'platform_name': os.getenv('OPT_PLATFORM_NAME')
    })
    plain_message = strip_tags(html_message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    to_email = user.email
    send_mail(subject, plain_message, from_email, [to_email], html_message=html_message)
    
 
def send_welcome_organization_email(organization_data):
    subject = EMAIL_SUBJECTS["welcome_organization_subject"]
    html_message = render_to_string('welcome_email_organization.html', {'organization': organization_data})
    plain_message = strip_tags(html_message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    to = organization_data['email']
    send_mail(subject, plain_message, from_email, [to], html_message=html_message)
    
    
def send_approve_organization_email(organization_data,slug_url):
    subject = EMAIL_SUBJECTS["approve_organization_subject"]
    html_message = render_to_string('approve_email_organization.html', {'organization': organization_data, 'slug_url': slug_url, 'platform_url': os.getenv('FRONTEND_DOMAIN_URL')})
    plain_message = strip_tags(html_message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    to = organization_data.email
    send_mail(subject, plain_message, from_email, [to], html_message=html_message)


