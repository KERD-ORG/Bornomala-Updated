from rest_framework import serializers
from django.core.validators import EmailValidator
from django.utils.translation import gettext_lazy as _
from .models import NewsletterSubscription

class NewsletterSubscriptionSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            EmailValidator(message=_("Please enter a valid email address."))
        ]
    )

    class Meta:
        model = NewsletterSubscription
        fields = '__all__'

    def validate_email(self, value):
        """
        Check that the email is not already in the database.
        """
        if NewsletterSubscription.objects.filter(email=value, deleted_at__isnull=True).exists():
            raise serializers.ValidationError(_("This email is already subscribed."))
        return value