from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from django_countries import countries
from campus_app.models import Campus
from .models import College, State

class CollegeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=255,
        required=True,
        allow_null=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters."),
            'blank': _("Name cannot be blank."),
            'null': _("Name cannot be blank."),
            'required': _("Name is required.")
        }
    )
    campus = serializers.PrimaryKeyRelatedField(
        queryset=Campus.objects.filter(deleted_at__isnull=True),
        required=False,
        error_messages={
            'required': _("Campus is required."),
            'null': _("Campus cannot be blank."),
            'does_not_exist': _("Specified campus does not exist or is not active."),
        }
    )

    campus_name = serializers.CharField(
        source='campus.campus_name', read_only=True
    )

    web_address = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True,
        error_messages={
            'invalid': _("Enter a valid URL."),
        }
    )
    address_line1 = serializers.CharField(
        max_length=255,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters."),
            'required': _("This field is required.")
        })
    address_line2 = serializers.CharField(
        max_length=255,
        allow_blank=True,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters.")
        })
    city = serializers.CharField(
        max_length=255,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters."),
            'required': _("This field is required.")
        })
    state_province = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
        allow_null=True
    )
    state_province_name = serializers.CharField(
        source='state_province.name', read_only=True
    )
    postal_code = serializers.CharField(
        max_length=20,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 20 characters."),
            'required': _("This field is required.")
        })
    country_code = serializers.CharField(
        max_length=2,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 2 characters."),
            'required': _("This field is required.")
        })
    country_name = serializers.SerializerMethodField()
    
    campus_educational_organization = serializers.SerializerMethodField()
    
    college_campus_educational_organization = serializers.SerializerMethodField()
    
    organization_name = serializers.SerializerMethodField()

    def get_campus_educational_organization(self, obj):
        if obj.campus and obj.campus.educational_organization:
            return f"{obj.campus.campus_name} - {obj.campus.educational_organization.name}"
        elif obj.campus:
            return obj.campus.campus_name
        else:
            return None
        
    def get_college_campus_educational_organization(self, obj):
        if obj.campus and obj.campus.educational_organization:
            return f"{obj.name} - {obj.campus.campus_name} - {obj.campus.educational_organization.name}"
        elif obj.campus:
            return f"{obj.name} - {obj.campus.campus_name}"
        else:
            return obj.name
        
    def get_organization_name(self, obj):
        if obj.campus and obj.campus.educational_organization:
            return obj.campus.educational_organization.name
        else:
            return None

    
    def get_country_name(self, obj):
        return countries.name(obj.country_code) if obj.country_code else None

    status = serializers.BooleanField()

    class Meta:
        model = College
        fields = ['id', 'name', 'campus', 'web_address', 'address_line1',
                  'address_line2', 'city', 'state_province', 'state_province_name', 'postal_code',
                  'country_code', 'statement', 'status', 'updated_at', 'country_name', 'campus_name', 
                  'campus_educational_organization', 'organization_name', 'college_campus_educational_organization']

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("Name cannot be empty."))
        return value

    def validate(self, data):
        name = data.get('name')
        campus = data.get('campus')
        
        organization = campus.educational_organization if campus else None

        if name and campus and organization:
   
            duplicate = College.objects.filter(
                name=name,
                campus=campus,
                campus__educational_organization=organization,
                deleted_at__isnull=True
            )
            
            if self.instance:
                duplicate = duplicate.exclude(pk=self.instance.pk)

            if duplicate.exists():
                raise serializers.ValidationError({
                    'name': _("A college with this name already exists in the specified campus and organization.")
                })

        return data