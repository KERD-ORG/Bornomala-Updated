from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from .models import FacultyMembers, User
from educational_organizations_app.models import EducationalOrganizations
from department_app.models import Department
from campus_app.models import Campus
from college_app.models import College
from django.contrib.auth.models import User
from common.models import State
from django_countries import countries



class FacultyMembersSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True,
        error_messages={
            'required': _("User is required."),
            'null': _("User cannot be blank."),
            'does_not_exist': _("Specified user does not exist."),
        }
    )
    user_name = serializers.CharField(
        source='user', read_only=True
    )
    educational_organization = serializers.PrimaryKeyRelatedField(
        queryset=EducationalOrganizations.objects.filter(deleted_at__isnull=True),
        required=True,
        error_messages={
            'required': _("Educational organization is required."),
            'null': _("Educational organization cannot be blank."),
            'does_not_exist': _("Specified educational organization does not exist or is not active."),
        }
    )
    educational_organization_name = serializers.CharField(
        source='educational_organization.name', read_only=True
    )
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(deleted_at__isnull=True),
        required=False,
        error_messages={
            'required': _("Department is required."),
            'null': _("Department cannot be blank."),
            'does_not_exist': _("Specified department does not exist or is not active."),
        }
    )
    department_name = serializers.CharField(
        source='department.name', read_only=True
    )
    campus = serializers.PrimaryKeyRelatedField(
        queryset=Campus.objects.filter(deleted_at__isnull=True),
        required=True,
        error_messages={
            'required': _("Campus is required."),
            'null': _("Campus cannot be blank."),
            'does_not_exist': _("Specified campus does not exist or is not active."),
        }
    )
    campus_name = serializers.CharField(
        source='campus.campus_name', read_only=True
    )
    college = serializers.PrimaryKeyRelatedField(
        queryset=College.objects.filter(deleted_at__isnull=True),
        required=True,
        error_messages={
            'required': _("College is required."),
            'null': _("College cannot be blank."),
            'does_not_exist': _("Specified college does not exist or is not active."),
        }
    )
    college_name = serializers.CharField(
        source='college.name', read_only=True
    )
    personal_web_address = serializers.URLField(
        allow_blank=True, allow_null=True,
        required=False,
        error_messages={
            'invalid': _("Enter a valid URL for the personal web address."),
        }
    )
    research_profile_address = serializers.URLField(
        allow_blank=True, allow_null=True,
        required=False,
        error_messages={
            'invalid': _("Enter a valid URL for the research profile address."),
        }
    )
    orcid = serializers.IntegerField(
        error_messages={
            'invalid': _("Enter a valid ORCID identifier."),
        }
    )
    faculty_type = serializers.CharField(
        allow_null=True, allow_blank=True,
        required=False,
        max_length=100,
        error_messages={
            'max_length': _("Ensure the faculty type has no more than 100 characters."),
            'blank': _("Faculty type cannot be blank."),
            'null': _("Faculty type cannot be null."),
        }
    )
    statement = serializers.CharField(
        allow_null=True, allow_blank=True,
        required=False,
        error_messages={
            'blank': _("Statement cannot be blank."),
            'null': _("Statement cannot be blank."),
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
    
    def get_country_name(self, obj):
        return countries.name(obj.country_code) if obj.country_code else None

    status = serializers.BooleanField()

    class Meta:
        model = FacultyMembers
        fields = ['id','user','user_name','educational_organization','educational_organization_name',
                  'department','department_name',
                  'campus','campus_name','college','college_name','personal_web_address',
                  'research_profile_address','orcid','faculty_type',
                  'address_line1','address_line2','city','state_province','state_province_name',
                  'postal_code','country_code','country_name','statement','status', 'updated_at',
                  'faculty_dept_institute',
                  ]

    faculty_dept_institute = serializers.SerializerMethodField()
    def get_faculty_dept_institute(self,obj):
        if obj:
            if  obj.department and obj.educational_organization:
                return (f'{obj.user.first_name} {obj.user.last_name} ({obj.user.username}) - {obj.department.name} - {obj.educational_organization.name}')
            elif obj.department :
                return (f'{obj.user.first_name} {obj.user.last_name} ({obj.user.username}) - {obj.department.name}')
            elif obj.educational_organization :
                return (f'{obj.user.first_name} {obj.user.last_name} ({obj.user.username}) - {obj.educational_organization.name}')
            else:
                return (f'{obj.user.first_name} {obj.user.last_name} ({obj.user.username})')
  
    def validate(self, data):
        if self.instance:
            duplicate = FacultyMembers.objects.filter(
                user=data.get('user', self.instance.user),
                educational_organization=data.get('educational_organization', self.instance.educational_organization),
                department=data.get('department', self.instance.department),
                campus=data.get('campus', self.instance.campus),
                college=data.get('college', self.instance.college),
                deleted_at__isnull=True
            ).exclude(pk=self.instance.pk)
        else:
            duplicate = FacultyMembers.objects.filter(
                user=data['user'],
                educational_organization=data['educational_organization'],
                department=data.get('department', None),
                campus=data['campus'],
                college=data['college'],
                deleted_at__isnull=True
            )

        if duplicate.exists():
            raise serializers.ValidationError({
                'user': _("A faculty member with these details already exists.")
            })

        return data
