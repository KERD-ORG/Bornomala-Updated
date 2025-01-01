# auth_app/signals.py
import os

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import ExtendedUser


from defender import signals
from django.utils.translation import gettext
from simple_history.utils import update_change_reason
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import send_mail
from history_metadata import generate_user_locked



@receiver(post_save, sender=User)
def create_or_update_extended_user(sender, instance, created, **kwargs):
    if created:
        pass
    else:
        pass

@receiver(signals.username_block)
def username_blocked(username, **kwargs):
    identifier=username
    cooloff_time_minutes = int(os.getenv('DEFENDER_COOLOFF_TIME'))/60 # kwargs.get('cooloff_time_minutes', None)
    if User.objects.filter(username=identifier).exists():
        user = User.objects.get(username=identifier)
    elif User.objects.filter(email=identifier).exists():
        user = User.objects.get(email=identifier)
    subject = gettext("Account locked for unusual Login Attempt" )
    message = render_to_string('lockout_email.html', {'user': user, 'locked_time':cooloff_time_minutes})
    plain_message = strip_tags(message)
    from_email = os.getenv('FROM_EMAIL_ADDRESS')
    send_mail(subject, plain_message, from_email, [user.email], html_message=message)
    update_change_reason(user, generate_user_locked())

@receiver(signals.ip_block)
def ip_blocked(ip_address, **kwargs):
    print("%s was blocked!" % ip_address)