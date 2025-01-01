from rest_framework import serializers
from django.contrib.auth.models import User
from auth_app.models import ExtendedUser
from .models import ReferenceInfo
from .models import UserDetails
from rest_framework.serializers import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.utils.translation import gettext_lazy
from datetime import datetime
from common.models import Document, UserDocument, State, Language, EthnicityOptions
from common.serializers import DocumentSerializer, UserDocumentSerializer
from utils import upload_file, delete_previous_documents, delete_previous_files_from_server
import os
from django_countries import countries
from datetime import datetime, timedelta

from django.core.validators import MaxLengthValidator

from rest_framework import serializers
from .models import ReferenceInfo
from django.utils.translation import gettext_lazy as _
from phonenumber_field.serializerfields import PhoneNumberField
import phonenumbers

class ReferenceInfoSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())
    # contact_number = PhoneNumberField(region="US")  
    contact_number = serializers.CharField()
    
    title = serializers.ChoiceField(choices=ReferenceInfo.TITLE_CHOICES, error_messages={
        'invalid_choice': _("Invalid title. Choose from Dr., Mr., Mrs., Ms., or Prof.")
    })

    first_name = serializers.CharField(max_length=100, error_messages={
        'max_length': _("Ensure this field has no more than 100 characters."),
    })
    middle_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, error_messages={
        'max_length': _("Ensure this field has no more than 100 characters."),
    })
    organization_name = serializers.CharField(max_length=255, error_messages={
        'max_length': _("Ensure this field has no more than 255 characters."),
    })
    designation = serializers.CharField(max_length=100, error_messages={
        'max_length': _("Ensure this field has no more than 100 characters."),
    })
    email_address = serializers.EmailField(max_length=100, error_messages={
        'max_length': _("Ensure this field has no more than 100 characters."),
    })
    relationship = serializers.CharField(max_length=100, error_messages={
        'max_length': _("Ensure this field has no more than 100 characters."),
    })

    class Meta:
        model = ReferenceInfo
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("First name is required."))
        return value

    def validate_last_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("Last name is required."))
        return value

    def validate_email_address(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("Email address is required."))
        return value

    def validate_contact_number(self, value):
        try:
            phone_number = phonenumbers.parse(value, None)  # Parsing without a default region
            if not phonenumbers.is_valid_number(phone_number):
                raise serializers.ValidationError(_("The phone number entered is not valid."))
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(_("The phone number entered is not valid. exception" + str(value)))
        
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        user_details = UserDetails.objects.get(user=user)
        validated_data['user_details'] = user_details
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user = self.context['request'].user
        user_details = UserDetails.objects.get(user=user)
        validated_data['user_details'] = user_details
        return super().update(instance, validated_data)
    

