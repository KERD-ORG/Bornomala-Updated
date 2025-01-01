from rest_framework import serializers
from .models import *
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from .models import ResearchInterestOptions
from .models import Document, UserDocument
import os

class ResearchInterestOptionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchInterestOptions
        fields = ['id', 'user_id', 'topic']
        
class SkillOptionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillOptions
        fields = ['id', 'skill_name']


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['type', 'user', 'file_name', 'file_name_system']

class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = ['document', 'use', 'user']
        
        
class CountriesSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(
            regex='^[a-zA-Z ]+$',
            message=_("Country name must contain only letters and spaces."),
            code='invalid_country_name'
        )]
    )
    country_code = serializers.CharField(
        max_length=200,
        validators=[RegexValidator(
            regex='^[a-zA-Z0-9]+$',
            message=_("Country code must be alphanumeric."),
            code='invalid_country_code'
        )],
        error_messages={
            'unique': _("This country code has already been registered.")
        }
    )

    def validate_country_code(self, value):
        """
        Check that the country code is not duplicate.
        """
        if Countries.objects.filter(country_code=value).exists():
            raise serializers.ValidationError(_("This country code has already been registered."))
        return value

    class Meta:
        model = Countries
        fields = ['id', 'country_name', 'country_code', 'deleted_at']

class GeoAdmin1Serializer(serializers.ModelSerializer):
    country = serializers.PrimaryKeyRelatedField(queryset=Countries.objects.filter(deleted_at__isnull=True))

    geo_admin_1_code = serializers.CharField(
        max_length=100,
        validators=[RegexValidator(
            regex='^[a-zA-Z0-9]+$',
            message=_("Geo-admin 1 code must be alphanumeric."),
            code='invalid_geo_admin_1_code'
        )],
        error_messages={
            'unique': _("This administrative code is already in use.")
        }
    )
    geo_admin_1_name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(
            regex='^[a-zA-Z ]+$',
            message=_("Geo-admin 1 name must contain only letters and spaces."),
            code='invalid_geo_admin_1_name'
        )]
    )

    def validate_country(self, value):
        if value.deleted_at is not None:
            raise serializers.ValidationError(_("The selected country is not active."))
        return value
    def validate_geo_admin_1_code(self, value):
        if GeoAdmin1.objects.filter(geo_admin_1_code=value, deleted_at__isnull=True).exists():
            raise serializers.ValidationError(_("This Geo-admin 1 code has already been registered."))
        return value

    class Meta:
        model = GeoAdmin1
        fields = ['id', 'country', 'geo_admin_1_code', 'geo_admin_1_name', 'deleted_at']


class GeoAdmin2Serializer(serializers.ModelSerializer):
    country = serializers.PrimaryKeyRelatedField(queryset=Countries.objects.filter(deleted_at__isnull=True))
    geo_admin_1 = serializers.PrimaryKeyRelatedField(queryset=GeoAdmin1.objects.filter(deleted_at__isnull=True))

    geo_admin_2_code = serializers.CharField(
        max_length=100,
        validators=[RegexValidator(
            regex='^[a-zA-Z0-9]+$',
            message=_("Geo-admin 2 code must be alphanumeric."),
            code='invalid_geo_admin_2_code'
        )]
    )
    geo_admin_2_name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(
            regex='^[a-zA-Z ]+$',
            message=_("Geo-admin 2 name must contain only letters and spaces."),
            code='invalid_geo_admin_2_name'
        )]
    )

    def validate_country(self, value):
        if value.deleted_at is not None:
            raise serializers.ValidationError(_("The selected country is not active."))
        return value

    def validate_geo_admin_1(self, value):
        if value.deleted_at is not None:
            raise serializers.ValidationError(_("The selected geo admin 1 is not active."))
        return value

    def validate_geo_admin_2_code(self, value):
        if GeoAdmin2.objects.filter(geo_admin_2_code=value).exists():
            raise serializers.ValidationError(_("This Geo-admin 2 code has already been registered."))
        return value

    class Meta:
        model = GeoAdmin2
        fields = ['id', 'country', 'geo_admin_1', 'geo_admin_2_code', 'geo_admin_2_name', 'deleted_at']