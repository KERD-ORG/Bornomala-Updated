import re
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.core.validators import URLValidator
from department_app.models import Department
from college_app.models import College
from django_countries import countries
from common.models import State
class DepartmentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters."),
            'blank': _("Name cannot be blank."),
            'null': _("Name cannot be null."),
            'required': _("Name is required.")
        }
    )
    
    college = serializers.PrimaryKeyRelatedField(
        queryset=College.objects.all(),
        allow_null =False,
        required=True,
        error_messages={
            'does_not_exist': _("The selected college does not exist."),
            'incorrect_type': _("Invalid type. Expected a college instance.")
        }
    )
    college_name = serializers.CharField(
        source='college.name', read_only=True
    )
    web_address = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        error_messages={
            'max_length': _("Ensure this field has no more than 255 characters."),
            'invalid': _("Enter a valid URL.")
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
    organization_name = serializers.SerializerMethodField()
    campus_name = serializers.SerializerMethodField()
    
    def get_country_name(self, obj):
        return countries.name(obj.country_code) if obj.country_code else None
    
    def get_campus_name(self, obj):
        if obj.college and obj.college.campus:
            return obj.college.campus.campus_name
        else:
            return None
    
    def get_organization_name(self, obj):
        if obj.college and obj.college.campus and obj.college.campus.educational_organization:
            return obj.college.campus.educational_organization.name
        else:
            return None
        
        
        
    def get_department_college_campus_educational_organization(self, obj):
        if obj.college and obj.college.campus and obj.college.campus.educational_organization:
            return f"{obj.name} - {obj.college.name} - {obj.college.campus.campus_name} - {obj.college.campus.educational_organization.name}"
        else:
            return obj.name

    status = serializers.BooleanField()
    class Meta:
        model = Department
        fields = ['id', 'name', 'campus_name', 'college', 'college_name',
                  'college_id', 'web_address', 'address_line1',
                  'address_line2', 'city', 'state_province', 'postal_code',
                  'country_name', 'country_code', 'statement', 'status',
                  'state_province_name', 'updated_at', 'organization_name',
                  'degrees_offered', 'dept_college_institute', 'department_college_campus_educational_organization']
        
    dept_college_institute= serializers.SerializerMethodField()
    
    department_college_campus_educational_organization= serializers.SerializerMethodField()
    
    def get_dept_college_institute (self,obj):
        if obj.college :    return (f'{obj.name} - {obj.college.name}')
        else:  return(f'{obj.name}')

    def validate_degrees_offered(self, value):
        if not value:
            raise serializers.ValidationError(_("Degree offered cannot be blank."))
        degrees_ids = value.split(',')
        if not all(degrees_ids):
            raise serializers.ValidationError(_("All degree IDs must be valid."))
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(_("Name cannot be empty."))
        if not re.match(r"^[A-Za-z\s]+$", value):
            raise serializers.ValidationError(_("Name should not contain special characters or numbers."))
        if len(value) > 255:
            raise serializers.ValidationError(_("Ensure this field has no more than 255 characters."))
        return value

    def validate_web_address(self, value):
        if value:
            url_validator = URLValidator()
            try:
                url_validator(value)
            except serializers.ValidationError:
                raise serializers.ValidationError(_("Enter a valid URL."))
        if len(value) > 255:
            raise serializers.ValidationError(_("Ensure this field has no more than 255 characters."))
        return value


    def validate(self, data):
        """
        Perform custom validations that need to inspect multiple fields.
        """
        
        if data.get('college') and data['college'].deleted_at is not None:
            raise serializers.ValidationError({"college": _("The linked college must be active.")})
        return data
