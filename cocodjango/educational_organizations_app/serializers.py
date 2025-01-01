import os
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email as django_validate_email
from django.utils.text import slugify
from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    EducationalOrganizationsCategory,
    EducationalOrganizations,
    Division,
)
from common.models import Document


class EducationalOrganizationsCategorySerializer(serializers.ModelSerializer):
    """ Serializer for EducationalOrganizationsCategory """
    name = serializers.CharField(
        max_length=255,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters.")
        }
    )
    description = serializers.CharField(
        allow_blank=True,
        allow_null=True
    )

    class Meta:
        model = EducationalOrganizationsCategory
        fields = ['id', 'name', 'description']


class EducationalOrganizationsSerializer(serializers.ModelSerializer):
    """
    Serializer for EducationalOrganizations
    Focused on Bangladesh:
      - Removed country_code, city, state_province references
      - Uses division, district
    """

    # Read-only slug generated from the organization name
    slug = serializers.SerializerMethodField()

    # Show the category name read-only
    under_category_name = serializers.CharField(
        source='under_category.name',
        read_only=True
    )

    # Division name read-only
    division_name = serializers.CharField(
        source='division.name',
        read_only=True
    )

    # Email, first_name, last_name validations
    email = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        allow_null=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters.")
        }
    )

    class Meta:
        model = EducationalOrganizations
        fields = [
            'id',
            'name',
            'under_category',
            'under_category_name',
            'web_address',
            'statement',
            'document',
            'status',
            'address_line1',
            'address_line2',
            'division',
            'division_name',
            'district',
            'postal_code',
            'first_name',
            'middle_name',
            'last_name',
            'email',
            'created_by',
            'updated_by',
            'slug',
        ]
        extra_kwargs = {
            'name': {
                'max_length': 255,
                'error_messages': {
                    'max_length': _("Ensure this field has no more than 255 characters.")
                }
            }
        }

    def validate_email(self, value):
        """
        Optional email field, but if provided, we check correctness & uniqueness
        """
        if value:
            value = value.strip()
            try:
                django_validate_email(value)
            except DjangoValidationError:
                raise serializers.ValidationError(_("Enter a valid email address."))

            # Example of uniqueness-check in the built-in User model,
            # remove if you don't have such a constraint
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError(_("This email address is already in use."))

        return value

    def validate_name(self, value):
        """
        Custom validation to ensure no duplicates for (name, under_category, district)
        when not soft-deleted
        """
        instance = self.instance
        under_category_id = self.initial_data.get('under_category') or (
            instance.under_category.id if instance and instance.under_category else None
        )
        district = self.initial_data.get('district') or (instance.district if instance else None)

        # We rely on your custom unique constraint in the model,
        # but we can also do an explicit check to show a clearer error message
        existing_qs = EducationalOrganizations.objects.filter(
            name=value,
            under_category_id=under_category_id,
            district=district,
            deleted_at__isnull=True
        )
        if instance:
            existing_qs = existing_qs.exclude(pk=instance.pk)

        if existing_qs.exists():
            raise serializers.ValidationError(
                _("A duplicate entry with the same name, category, and district already exists.")
            )
        return value

    def get_slug(self, obj):
        """Generate slug from the name"""
        return slugify(obj.name)

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        if user:
            validated_data['created_by'] = user
            validated_data['updated_by'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        if user:
            validated_data['updated_by'] = user
        return super().update(instance, validated_data)
