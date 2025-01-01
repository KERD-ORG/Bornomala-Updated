from rest_framework import serializers
from .models import ContactUs
from common.emails import send_contact_email_to_admin
from simple_history.utils import update_change_reason
from history_metadata import generate_contact_creation_reason
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from .messages import SUCCESS_MESSAGES, ERROR_MESSAGES

class ContactUsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactUs
        fields = ["created_at", "updated_at", "deleted_at", "full_name", "email", "message"]
        read_only_fields = ["created_at", "updated_at", "deleted_at"]
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate_full_name(self, value):
        if not value:
            raise serializers.ValidationError(ERROR_MESSAGES['full_name_required'])
        return value
    
    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError(ERROR_MESSAGES['email_invalid'])

        try:
            django_validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError(ERROR_MESSAGES['email_invalid'])

        return value
    
    def validate_message(self, value):
        if not value:
            raise serializers.ValidationError(ERROR_MESSAGES['message_required'])
        return value

    def create(self, validated_data):
        instance = super().create(validated_data=validated_data)
        update_change_reason(instance, generate_contact_creation_reason())
        send_contact_email_to_admin(
            requested_name=validated_data.get("full_name", ""),
            requested_email=validated_data.get("email", ""),
            message=validated_data.get("message", ""),
        )
        return instance