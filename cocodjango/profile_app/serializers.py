from rest_framework import serializers
from django.contrib.auth.models import User
from auth_app.models import ExtendedUser
from .models import UserDetails
from .models import Citizenship
from .models import Visa
from .models import Dissertation
from .models import ResearchExperience
from .models import Publication
from .models import WorkExperience
from .models import Skill
from .models import TrainingWorkshop
from .models import AwardGrantScholarship
from .models import VolunteerActivity
from rest_framework.serializers import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from .models import ResearchInterest
from common.models import ResearchInterestOptions, SkillOptions
from common.serializers import ResearchInterestOptionsSerializer, SkillOptionsSerializer
from django.utils.translation import gettext_lazy
from datetime import datetime
from common.models import Document, UserDocument, State, Language, EthnicityOptions
from common.serializers import DocumentSerializer, UserDocumentSerializer
from utils import upload_file, delete_previous_documents, delete_previous_files_from_server
import os
from django_countries import countries
from datetime import datetime, timedelta
from .models import EducationalBackground
from django.core.validators import MaxLengthValidator


class UserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDetails
        exclude = ['history']


class UserBiographicInformationSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(
        source='user.first_name',
        required=True,
        allow_blank=False,
        max_length=100,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
        }

    )
    middle_name = serializers.CharField(
        source='user.extendeduser.middle_name',
        required=False,
        allow_blank=True,
        max_length=30,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 30 characters."),
        }

    )
    last_name = serializers.CharField(
        source='user.last_name',
        required=True,
        allow_blank=False,
        max_length=100,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
        }

    )

    date_of_birth = serializers.DateField(
        required=False,
        error_messages={
            'invalid': gettext_lazy("Enter a valid date."),
        }
    )

    city_of_birth = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
        }
    )

    country_of_birth = serializers.CharField(max_length=100,  required=False, allow_blank=True, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
    })

    class Meta:
        model = UserDetails
        fields = ['first_name', 'middle_name', 'last_name',
                  'date_of_birth', 'city_of_birth', 'country_of_birth']

    def validate_date_of_birth(self, value):
        min_age = int(os.getenv('MIN_DATE_OF_BIRTH', '16'))
        # Calculate the minimum allowed birth date for age ...
        min_birth_date = datetime.now().date() - timedelta(days=min_age*365.25)

        if value > min_birth_date:
            raise serializers.ValidationError(
                gettext_lazy(f"You must be at least {min_age} years old.")
            )

        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_first_name = user_data.pop('first_name')
        user_last_name = user_data.pop('last_name')

        extended_user_data = user_data.pop('extendeduser')
        user_middle_name = extended_user_data.pop('middle_name')

        user = self.context['request'].user

        user.first_name = user_first_name
        user.last_name = user_last_name
        user.save()

        extended_user = ExtendedUser.objects.get(user=user)
        extended_user.middle_name = user_middle_name
        extended_user.save()

        user_details = UserDetails.objects.create(user=user, **validated_data)

        return user_details

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user_first_name = user_data.pop(
                'first_name', instance.user.first_name)
            user_last_name = user_data.pop(
                'last_name', instance.user.last_name)

            extended_user_data = user_data.pop('extendeduser', {})
            user_middle_name = extended_user_data.pop(
                'middle_name', instance.user.extendeduser.middle_name)

            user = instance.user

            user.first_name = user_first_name
            user.last_name = user_last_name
            user.save()

            extended_user = ExtendedUser.objects.get(user=user)
            extended_user.middle_name = user_middle_name
            extended_user.save()

        instance.date_of_birth = validated_data.get(
            'date_of_birth', instance.date_of_birth)
        instance.city_of_birth = validated_data.get(
            'city_of_birth', instance.city_of_birth)
        instance.country_of_birth = validated_data.get(
            'country_of_birth', instance.country_of_birth)
        instance.save()

        return instance


class ContactInformationSerializer(serializers.ModelSerializer):
    current_address_line1 = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
        })
    current_address_line2 = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
        })
    current_city = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
        })
    current_state_province = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
        allow_null=True
    )
    current_state_province_name = serializers.CharField(
        source='current_state_province.name', read_only=True
    )
    current_postal_code = serializers.CharField(
        max_length=20,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 20 characters."),
        })
    current_country = serializers.CharField(
        max_length=2,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 2 characters."),
        })
    current_country_name = serializers.SerializerMethodField()

    permanent_address_status = serializers.BooleanField(
        required=False,
        allow_null=True
    )
    permanent_address_line1 = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
        })
    permanent_address_line2 = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
        })
    permanent_city = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
        })
    permanent_state_province = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
        allow_null=True,
        default=None
    )
    permanent_state_province_name = serializers.CharField(
        source='permanent_state_province.name', read_only=True
    )
    permanent_postal_code = serializers.CharField(
        max_length=20,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 20 characters."),
        })
    permanent_country = serializers.CharField(
        max_length=2,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 2 characters."),
        })
    permanent_country_name = serializers.SerializerMethodField()

    class Meta:
        model = UserDetails
        fields = [
            'current_address_line1', 'current_address_line2', 'current_city',
            'current_state_province', 'current_state_province_name', 'current_postal_code', 'current_country', 'current_country_name',
            'permanent_address_status', 'permanent_address_line1', 'permanent_address_line2',
            'permanent_city', 'permanent_state_province', 'permanent_state_province_name', 'permanent_postal_code', 'permanent_country', 'permanent_country_name'
        ]

    def get_current_country_name(self, obj):
        return countries.name(obj.current_country) if obj.current_country else None

    def get_permanent_country_name(self, obj):
        return countries.name(obj.permanent_country) if obj.permanent_country else None

    def create(self, validated_data):
        return UserDetails.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.current_address_line1 = validated_data.get(
            'current_address_line1', instance.current_address_line1)
        instance.current_address_line2 = validated_data.get(
            'current_address_line2', instance.current_address_line2)
        instance.current_city = validated_data.get(
            'current_city', instance.current_city)
        instance.current_state_province = validated_data.get(
            'current_state_province', instance.current_state_province)
        instance.current_postal_code = validated_data.get(
            'current_postal_code', instance.current_postal_code)
        instance.current_country = validated_data.get(
            'current_country', instance.current_country)
        instance.permanent_address_status = validated_data.get(
            'permanent_address_status', instance.permanent_address_status)
        instance.permanent_address_line1 = validated_data.get(
            'permanent_address_line1', instance.permanent_address_line1)
        instance.permanent_address_line2 = validated_data.get(
            'permanent_address_line2', instance.permanent_address_line2)
        instance.permanent_city = validated_data.get(
            'permanent_city', instance.permanent_city)
        instance.permanent_state_province = validated_data.get(
            'permanent_state_province', instance.permanent_state_province)
        instance.permanent_postal_code = validated_data.get(
            'permanent_postal_code', instance.permanent_postal_code)
        instance.permanent_country = validated_data.get(
            'permanent_country', instance.permanent_country)
        instance.save()
        return instance


class ResearchInterestSerializer(serializers.ModelSerializer):
    research_interests_option = ResearchInterestOptionsSerializer(
        read_only=True)
    research_interests_option_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ResearchInterest
        fields = ['id', 'research_interests_option',
                  'user_details', 'research_interests_option_id']
        extra_kwargs = {
            'research_interests_option': {'read_only': True},
        }

    def validate_research_interests_option_id(self, value):
        if not value:
            raise serializers.ValidationError(
                "Research Interest Option is required")
        try:
            ResearchInterestOptions.objects.get(id=value)
        except ResearchInterestOptions.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid Research Interest Option ID")
        return value

    def create(self, validated_data):
        validated_data['research_interests_option'] = ResearchInterestOptions.objects.get(
            id=validated_data.pop('research_interests_option_id'))
        return super().create(validated_data)


class ResumeUploadSerializer(serializers.Serializer):
    resume = serializers.FileField(
        required=True,
        allow_null=False,
        error_messages={
            'required': gettext_lazy("Please upload a file."),
            'null': gettext_lazy("Please upload a file."),
            'invalid': gettext_lazy("Please upload a valid file."),
        }
    )

    def validate_resume(self, value):

        if not value:
            raise serializers.ValidationError(
                gettext_lazy("No file uploaded."))

        if not value.name.strip():
            raise serializers.ValidationError(
                gettext_lazy("Please upload a valid file."))

        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError(gettext_lazy(
                "Invalid file type. Only PDF files are allowed."))

        user = self.context['request'].user

        new_document_ids = []

        try:
            # Perform file upload operation
            resume_upload_success, resume_upload_error = upload_file(
                value, UserDocument.RESUME, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))
            if not resume_upload_success:
                raise serializers.ValidationError(resume_upload_error)
            else:
                new_document_ids.append(UserDocument.objects.filter(
                    user=user, use=UserDocument.RESUME).latest('created_at').document.id)
                delete_previous_files_from_server(
                    user, UserDocument.RESUME, exclude_document_ids=new_document_ids)
                delete_previous_documents(
                    user, UserDocument.RESUME, exclude_document_ids=new_document_ids)

        except Exception as e:
            raise serializers.ValidationError(resume_upload_error)

        # Return the validated file
        return value

    def create(self, validated_data):
        pass


class SopUploadSerializer(serializers.Serializer):
    sop = serializers.FileField(
        required=True,
        allow_null=False,
        error_messages={
            'required': gettext_lazy("Please upload a file."),
            'null': gettext_lazy("Please upload a file."),
            'invalid': gettext_lazy("Please upload a valid file."),
        }
    )

    def validate_sop(self, value):

        if not value:
            raise serializers.ValidationError(
                gettext_lazy("No file uploaded."))

        if not value.name.strip():
            raise serializers.ValidationError(
                gettext_lazy("Please upload a valid file."))

        if not value.name.endswith('.pdf'):
            raise serializers.ValidationError(gettext_lazy(
                "Invalid file type. Only PDF files are allowed."))

        user = self.context['request'].user

        new_document_ids = []

        try:
            # Perform file upload operation
            sop_upload_success, sop_upload_error = upload_file(
                value, UserDocument.SOP, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))
            if not sop_upload_success:
                raise serializers.ValidationError(sop_upload_error)
            else:
                new_document_ids.append(UserDocument.objects.filter(
                    user=user, use=UserDocument.SOP).latest('created_at').document.id)
                delete_previous_files_from_server(
                    user, UserDocument.SOP, exclude_document_ids=new_document_ids)
                delete_previous_documents(
                    user, UserDocument.SOP, exclude_document_ids=new_document_ids)

        except Exception as e:
            raise serializers.ValidationError(resume_upload_error)

        # Return the validated file
        return value

    def create(self, validated_data):
        pass


class EthnicityInfoSerializer(serializers.ModelSerializer):
    ethnicity = serializers.ChoiceField(choices=EthnicityOptions.get_ethnicity_choices(), error_messages={
        'required': gettext_lazy("Ethnicity is required.")
    })
    ethnicity_details = serializers.CharField(
        max_length=255, allow_blank=True, required=False)
    ethnicity_origin = serializers.IntegerField(required=True, error_messages={
        'required': gettext_lazy("Ethnicity origin field is required.")
    })
    ethnicity_reporting = serializers.IntegerField(required=True, error_messages={
        'required': gettext_lazy("Preference on Ethnicity Reporting is required.")
    })

    class Meta:
        model = UserDetails
        fields = ['ethnicity', 'ethnicity_details',
                  'ethnicity_origin', 'ethnicity_reporting']

    def validate_ethnicity_origin(self, value):
        if value not in [0, 1]:
            raise serializers.ValidationError(
                gettext_lazy("Ethnicity origin must be either true or false.")
            )
        return value

    def validate_ethnicity_reporting(self, value):
        if value not in [0, 1]:
            raise serializers.ValidationError(
                gettext_lazy(
                    "Preference on Ethnicity Reporting must be either true or false.")
            )
        return value

    def update(self, instance, validated_data):
        instance.ethnicity = validated_data.get(
            'ethnicity', instance.ethnicity)
        instance.ethnicity_details = validated_data.get(
            'ethnicity_details', instance.ethnicity_details)
        instance.ethnicity_origin = validated_data.get(
            'ethnicity_origin', instance.ethnicity_origin)
        instance.ethnicity_reporting = validated_data.get(
            'ethnicity_reporting', instance.ethnicity_reporting)
        instance.save()
        return instance


class OtherInfoSerializer(serializers.ModelSerializer):
    first_language = serializers.PrimaryKeyRelatedField(
        queryset=Language.objects.all(),
        required=True,
        error_messages={
            'required': gettext_lazy("First language is required."),
            'null': gettext_lazy("First language cannot be null."),
            'invalid': gettext_lazy("Invalid language ID."),
            'does_not_exist': gettext_lazy("Language with this ID does not exist."),
            'incorrect_type': gettext_lazy("Incorrect type. Expected pk value, received {data_type}.")
        }
    )
    other_languages = serializers.CharField(
        max_length=255, allow_blank=True, required=False
    )
    parental_college_graduation_status = serializers.IntegerField(
        required=True,
        error_messages={
            'required': gettext_lazy("Parental college graduation status is required.")
        }
    )

    class Meta:
        model = UserDetails
        fields = ['first_language', 'other_languages',
                  'parental_college_graduation_status']

    def validate_other_languages(self, value):
        if value:
            language_ids = value.split(',')
            for language_id in language_ids:
                if not Language.objects.filter(id=language_id.strip()).exists():
                    raise serializers.ValidationError(
                        gettext_lazy(
                            f"Languages is/are not valid.")
                    )
        return value

    def update(self, instance, validated_data):
        instance.first_language = validated_data.get(
            'first_language', instance.first_language)
        instance.other_languages = validated_data.get(
            'other_languages', instance.other_languages)
        instance.parental_college_graduation_status = validated_data.get(
            'parental_college_graduation_status', instance.parental_college_graduation_status)
        instance.save()
        return instance


class AcknowledgementInfoSerializer(serializers.ModelSerializer):
    acknowledgement = serializers.IntegerField(
        required=True,
        error_messages={
            'required': gettext_lazy("Acknowledgement is required."),
            'invalid': gettext_lazy("Invalid acknowledgement value."),
        }
    )

    class Meta:
        model = UserDetails
        fields = ['acknowledgement']


class EducationalBackgroundSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(
        default=serializers.CurrentUserDefault())

    institution_name = serializers.CharField(max_length=100, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
    })
    institution_address = serializers.CharField(max_length=100, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
    })
    major = serializers.CharField(max_length=100, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
    })

    class Meta:
        model = EducationalBackground
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_institution_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Institution name is required."))
        return value

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError(
                gettext_lazy("Start date is required."))
        return value

    def validate_major(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Major is required."))
        return value

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        degree_date = data.get('degree_date')

        if end_date and start_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': gettext_lazy("End date must be greater than start date.")
            })

        if degree_date:
            if start_date and degree_date <= start_date:
                raise serializers.ValidationError({
                    'degree_date': gettext_lazy("Degree date must be greater than start date.")
                })
            if end_date and degree_date <= end_date:
                raise serializers.ValidationError({
                    'degree_date': gettext_lazy("Degree date must be greater than end date.")
                })

        return data

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


class DissertationSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(
        default=serializers.CurrentUserDefault())

    title = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    academic_level = serializers.CharField(max_length=50, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 50 characters."),
    })
    full_dissertation_link = serializers.URLField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })

    class Meta:
        model = Dissertation
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Title is required."))
        return value
    
    def validate_academic_level(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Academic Level is required."))
            
    def validate_full_dissertation_link(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Full Dissertation Link is required."))

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError(
                gettext_lazy("Start date is required."))
        return value
    
    # def validate_end_date(self, value):
    #     if not value:
    #         raise serializers.ValidationError(
    #             gettext_lazy("End date is required."))
    #     return value

    def validate_full_dissertation_link(self, value):
        url_validator = URLValidator()
        try:
            url_validator(value)
        except DjangoValidationError:
            raise serializers.ValidationError(
                gettext_lazy("Enter a valid URL."))
        return value

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if end_date and start_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': gettext_lazy("End date must be greater than start date.")
            })
        return data

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


class ResearchExperienceSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(
        default=serializers.CurrentUserDefault())

    title = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    supervisor = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    organization = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })

    class Meta:
        model = ResearchExperience
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Title is required."))
        return value
    
    def validate_supervisor(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Supervisor is required."))
        return value
    
    def validate_organization(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Organization is required."))
        return value

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError(
                gettext_lazy("Start date is required."))
        return value

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if end_date and start_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': gettext_lazy("End date must be greater than start date.")
            })
        return data

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


class PublicationSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())

    title = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    publication_type = serializers.ChoiceField(choices=Publication.PUBLICATION_TYPE_CHOICES, validators=[MaxLengthValidator(20)], error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 20 characters."),
        'invalid_choice': gettext_lazy("Invalid publication type."),
    })
    doi_link = serializers.URLField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    name = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    
    publication_date = serializers.DateField(error_messages={
        'invalid': gettext_lazy("Enter a valid date."),
    })


    class Meta:
        model = Publication
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Title is required."))
        return value

    def validate_authors(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Authors are required."))
        return value

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("Publication date is required."))
        return value

    def validate_doi_link(self, value):
        url_validator = URLValidator()
        try:
            url_validator(value)
        except DjangoValidationError:
            raise serializers.ValidationError(gettext_lazy("Enter a valid URL."))
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
    
    
    

class WorkExperienceSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())

    position_title = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    company_name = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    location = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    
    start_date = serializers.DateField(error_messages={
        'invalid': gettext_lazy("Enter a valid date."),
    })
    
    end_date = serializers.DateField(error_messages={
        'invalid': gettext_lazy("Enter a valid date."),
    })

    class Meta:
        model = WorkExperience
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_position_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Position title is required."))
        return value

    def validate_company_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Company name is required."))
        return value

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("Start date is required."))
        return value
    
    # def validate_end_date(self, value):
    #     if not value:
    #         raise serializers.ValidationError(gettext_lazy("End date is required."))
    #     return value

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if end_date and start_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': gettext_lazy("End date must be greater than start date.")
            })
        return data

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
    
    

class SkillSerializer(serializers.ModelSerializer):
    skill_option = SkillOptionsSerializer(read_only=True)
    skill_option_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'skill_option', 'user_details', 'skill_option_id']
        extra_kwargs = {
            'skill_option': {'read_only': True},
        }

    def validate_skill_option_id(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("Skill Option is required"))
        try:
            SkillOptions.objects.get(id=value)
        except SkillOptions.DoesNotExist:
            raise serializers.ValidationError(gettext_lazy("Invalid Skill Option ID"))
        return value

    def create(self, validated_data):
        validated_data['skill_option'] = SkillOptions.objects.get(
            id=validated_data.pop('skill_option_id'))
        return super().create(validated_data)


class TrainingWorkshopSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())

    name = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    organizer = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    location = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    
    start_date = serializers.DateField(error_messages={
        'invalid': gettext_lazy("Enter a valid date."),
    })
    
    completion_date = serializers.DateField(error_messages={
        'invalid': gettext_lazy("Enter a valid date."),
    })

    class Meta:
        model = TrainingWorkshop
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Name is required."))
        return value
    
    def validate_organizer(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Organizer is required."))
        return value
    
    def validate_location(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Location is required."))
        return value
    
    def validate_certificate(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Certificate is required."))
        return value

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("Start date is required."))
        return value

    def validate(self, data):
        start_date = data.get('start_date')
        completion_date = data.get('completion_date')

        if completion_date and start_date and completion_date <= start_date:
            raise serializers.ValidationError({
                'completion_date': gettext_lazy("Completion date must be greater than start date.")
            })
        return data

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


class AwardGrantScholarshipSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())

    name = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    awarding_organization = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    
    date_received = serializers.DateField(error_messages={
        'invalid': gettext_lazy("Enter a valid date."),
    })

    class Meta:
        model = AwardGrantScholarship
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Name is required."))
        return value
    
    def validate_awarding_organization(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Awarding organization is required."))
        return value

    def validate_date_received(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("Date received is required."))
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
    
    
class VolunteerActivitySerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())

    organization_name = serializers.CharField(max_length=255, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 255 characters."),
    })
    designation = serializers.CharField(max_length=100, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 100 characters."),
    })

    class Meta:
        model = VolunteerActivity
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_organization_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(gettext_lazy("Organization name is required."))
        return value

    def validate_start_date(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("Start date is required."))
        return value

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if end_date and start_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': gettext_lazy("End date must be greater than start date.")
            })
        return data

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
    
    
    
class CitizenshipSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    state_province = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
        allow_null=True
    )
    
    state_province_name = serializers.CharField(
        source='state_province.name', read_only=True
    )
    
    country_code = serializers.CharField(
        max_length=2,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 2 characters."),
        })
    
    country_name = serializers.SerializerMethodField()

    class Meta:
        model = Citizenship
        fields = '__all__'
        read_only_fields = ('user_details',)
        
    def validate_country(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Country is required."))
        if len(value.strip()) > 100:
            raise serializers.ValidationError(gettext_lazy(
                "Country cannot be longer than 100 characters."))
        return value.strip()

    def get_country_name(self, obj):
        return countries.name(obj.country_code) if obj.country_code else None

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
    
    
class VisaSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    state_province = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
        allow_null=True
    )
    
    state_province_name = serializers.CharField(
        source='state_province.name', read_only=True
    )
    
    country_code = serializers.CharField(
        max_length=2,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            'max_length': gettext_lazy("Ensure this field has no more than 2 characters."),
        })
    
    country_name = serializers.SerializerMethodField()
    
    expiration_date = serializers.DateField(
        format="%Y-%m-%d", input_formats=["%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%d"])

    class Meta:
        model = Visa
        fields = '__all__'
        read_only_fields = ('user_details',)
        
    def validate_visa_type(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Visa type is required."))
        if len(value.strip()) > 100:
            raise serializers.ValidationError(gettext_lazy(
                "Visa type cannot be longer than 100 characters."))
        return value.strip()
        
    def validate_country(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                gettext_lazy("Country is required."))
        if len(value.strip()) > 100:
            raise serializers.ValidationError(gettext_lazy(
                "Country cannot be longer than 100 characters."))
        return value.strip()
    
    def validate_expiration_date(self, value):
        if isinstance(value, str):
            try:
                value = datetime.strptime(
                    value, "%Y-%m-%dT%H:%M:%S.%fZ").date()
            except ValueError:
                raise serializers.ValidationError(
                    gettext_lazy("Date has wrong format. Use one of these formats instead: YYYY-MM-DD."))
        if value < datetime.now().date():
            raise serializers.ValidationError(gettext_lazy(
                "Expiration date cannot be in the past."))
        return value

    def get_country_name(self, obj):
        return countries.name(obj.country_code) if obj.country_code else None

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
    
