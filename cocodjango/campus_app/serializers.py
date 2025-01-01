from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from common.models import State
from educational_organizations_app.models import EducationalOrganizations
from .models import Campus
from django_countries import countries


class CampusSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(
        max_length=255,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters."),
            'required': _("This field is required.")
        }
    )
    educational_organization = serializers.PrimaryKeyRelatedField(
        queryset=EducationalOrganizations.objects.all(),
        allow_null=False,
        required=True,
        error_messages={
            'required': _("This field is required."),
            'invalid': _("Invalid educational organization.")
        }
    )
    educational_organization_name = serializers.CharField(
        source='educational_organization.name', read_only=True
    )
    address_line1 = serializers.CharField(
        max_length=255,
        allow_blank=True,
        allow_null=True,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters.")
        }
    )
    address_line2 = serializers.CharField(
        max_length=255,
        allow_blank=True,
        allow_null=True,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters.")
        }
    )
    city = serializers.CharField(
        max_length=255,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters."),
            'required': _("This field is required.")
        }
    )
    state_province = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        allow_null=True,
        required=False,
        error_messages={
            'invalid': _("Invalid state or province.")
        }
    )
    state_province_name = serializers.CharField(
        source='state_province.name', read_only=True
    )
    postal_code = serializers.CharField(
        max_length=20,
        allow_blank=True,
        allow_null=True,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 20 characters.")
        }
    )
    country_code = serializers.CharField(
        max_length=2,
        allow_blank=True,
        allow_null=True,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 2 characters.")
        }
    )
    country_name = serializers.SerializerMethodField()
    statement = serializers.CharField(
        allow_blank=True,
        allow_null=True
    )
    status = serializers.BooleanField()
    state_province_name = serializers.CharField(
        source='state_province.name', read_only=True
    )
    educational_organization_name = serializers.CharField(
        source='educational_organization.name', read_only=True
    )
    
    campus_educational_organization = serializers.SerializerMethodField()  # New custom field
    
    class Meta:
        model = Campus
        fields = [
            'id', 'campus_name', 'educational_organization', 'address_line1', 'address_line2',
            'city', 'state_province', 'state_province_name', 'postal_code', 'country_code',
            'statement', 'status', 'educational_organization_name', 'country_name', 'updated_at',
            'campus_educational_organization'
        ]

    def get_country_name(self, obj):
        return countries.name(obj.country_code) if obj.country_code else None
    
    def get_campus_educational_organization(self, obj):
        """Returns a combined name of campus and educational organization."""
        return f"{obj.campus_name} - {obj.educational_organization.name if obj.educational_organization else ''}"


    def validate_campus_name(self, value):
        educational_organization = self.initial_data.get('educational_organization') or (
            self.instance.educational_organization.id if self.instance and self.instance.educational_organization else None)
        country_code = self.initial_data.get('country_code') or (self.instance.country_code if self.instance else None)
        city = self.initial_data.get('city') or (self.instance.city if self.instance else None)
        state_province = self.initial_data.get('state_province') or (
            self.instance.state_province.id if self.instance and self.instance.state_province else None)
        
        existing_instance = Campus.objects.filter(
            campus_name=value,
            educational_organization=educational_organization,
            country_code=country_code,
            city=city,
            state_province=state_province
        ).exclude(pk=self.instance.pk if self.instance else None).first()
        
        if existing_instance:
            raise serializers.ValidationError(
                _("A duplicate entry with the same campus name, educational organization, country code, city, and state or province already exists.")
            )
        
        return value
