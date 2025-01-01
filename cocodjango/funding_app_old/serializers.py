from datetime import datetime
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Funding, Benefit


class BenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Benefit
        fields = '__all__'

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(_('Name cannot be blank.'))
        return value

    def validate_details(self, value):
        if not value.strip():
            raise serializers.ValidationError(_('Details cannot be blank.'))
        return value


class FundingSerializer(serializers.ModelSerializer):
    originator = serializers.ChoiceField(choices=Funding.ORIGINATOR_CHOICES, error_messages={
        'required': _("Originator is required."),
        'invalid_choice': _("Invalid choice for originator."),
        'null': _("This field may not be null.")
    })
    funding_type = serializers.ChoiceField(choices=Funding.FUNDING_TYPE_CHOICES, error_messages={
        'required': _("Funding type is required."),
        'invalid_choice': _("Invalid choice for funding type."),
        'null': _("This field may not be null.")
    })
    amount_type = serializers.ChoiceField(choices=Funding.AMOUNT_TYPE_CHOICES, error_messages={
        'required': _("Amount type is required."),
        'invalid_choice': _("Invalid choice for amount type."),
        'null': _("This field may not be null.")
    })
    funding_for = serializers.ChoiceField(choices=Funding.FUNDING_FOR_CHOICES, error_messages={
        'required': _("Funding for is required."),
        'invalid_choice': _("Invalid choice for funding for."),
        'null': _("This field may not be null.")
    })
    amount = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        min_value=0.0,
        error_messages={
            'required': _("Amount is required."),
            'invalid': _("Invalid amount."),
            'max_digits': _("Amount has too many digits."),
            'max_decimal_places': _("Amount has too many decimal places."),
            'min_value': _("Amount must be at least 0."),
            'null': _("This field may not be null.")
        }
    )

    originator_faculty_member_name = serializers.CharField(
        source='originator_faculty_member.user.username', read_only=True
    )
    originator_edu_org_name = serializers.CharField(
        source='originator_edu_org.name', read_only=True
    )
    funding_for_faculty_name = serializers.CharField(
        source='funding_for_faculty.user.username', read_only=True
    )
    funding_for_department_name = serializers.CharField(
        source='funding_for_department.name', read_only=True
    )
    web_address = serializers.URLField(
        allow_blank=True,
        allow_null=True,
        required=False, 
        error_messages={
            'invalid': _("Enter a valid URL.")
        }
    )
    benefits_name = BenefitSerializer(source='benefits', many=True, read_only=True)

    class Meta:
        model = Funding
        fields = [
            'id',
            'originator', 'originator_edu_org', 'originator_edu_org_name', 'originator_faculty_member', 'originator_faculty_member_name', 'originator_other_name',
            'funding_type', 'funding_type_name',
            'amount','web_address',
            'amount_type', 'amount_type_name',
            'benefits', 'benefits_name',
            'funding_for', 'funding_for_faculty', 'funding_for_faculty_name', 'funding_for_department', 'funding_for_department_name', 'funding_for_other_name',
            'funding_open_date', 'funding_end_date', 'updated_at','created_by','updated_by',
        ]

    def validate_funding_open_date(self, value):
        funding_end_date = self.initial_data.get('funding_end_date')
        if funding_end_date:
            try:
                funding_end_date = datetime.strptime(funding_end_date, '%Y-%m-%d').date()
                if value > funding_end_date:
                    raise serializers.ValidationError(_('Funding open date cannot be later than funding end date.'))
            except ValueError:
                raise serializers.ValidationError(_('Invalid date format for funding end date.'))
        return value

    def validate_funding_end_date(self, value):
        funding_open_date = self.initial_data.get('funding_open_date')
        if funding_open_date:
            try:
                funding_open_date = datetime.strptime(funding_open_date, '%Y-%m-%d').date()
                if value < funding_open_date:
                    raise serializers.ValidationError(_('Funding end date cannot be earlier than funding open date.'))
            except ValueError:
                raise serializers.ValidationError(_('Invalid date format for funding open date.'))
        return value

    def validate(self, data):
        originator = data.get('originator')
        if originator == Funding.EDU_ORG:
            if not data.get('originator_edu_org'):
                raise serializers.ValidationError({'originator_edu_org': _("Educational organization is required when originator is Educational Organization.")})
            data['originator_faculty_member'] = None
            data['originator_other_name'] = None
        elif originator == Funding.FACULTY:
            if not data.get('originator_faculty_member'):
                raise serializers.ValidationError({'originator_faculty_member': _("Faculty member is required when originator is Faculty Member.")})
            data['originator_edu_org'] = None
            data['originator_other_name'] = None
        elif originator == Funding.OTHERS:
            if not data.get('originator_other_name'):
                raise serializers.ValidationError({'originator_other_name': _("Other originator name is required when originator is Other.")})
            data['originator_edu_org'] = None
            data['originator_faculty_member'] = None

        if data.get('funding_type') != 'Other':
            data['funding_type_name'] = None
        else:
            if not data.get('funding_type_name'):
                raise serializers.ValidationError({'funding_type_name': _("Funding type name is required when funding type is Other.")})

        if data.get('amount_type') != 'Other':
            data['amount_type_name'] = None
        else:
            if not data.get('amount_type_name'):
                raise serializers.ValidationError({'amount_type_name': _("Amount type name is required when amount type is Other.")})

        funding_for = data.get('funding_for')
        if funding_for == Funding.FACULTY:
            if not data.get('funding_for_faculty'):
                raise serializers.ValidationError({'funding_for_faculty': _("Faculty is required when funding is for Faculty.")})
            data['funding_for_department'] = None
            data['funding_for_other_name'] = None
        elif funding_for == Funding.DEPARTMENT:
            if not data.get('funding_for_department'):
                raise serializers.ValidationError({'funding_for_department': _("Department is required when funding is for Department.")})
            data['funding_for_faculty'] = None
            data['funding_for_other_name'] = None
        elif funding_for == Funding.OTHERS:
            if not data.get('funding_for_other_name'):
                raise serializers.ValidationError({'funding_for_other_name': _("Other funding for name is required when funding is for Other.")})
            data['funding_for_faculty'] = None
            data['funding_for_department'] = None

        funding_open_date = data.get('funding_open_date')
        funding_end_date = data.get('funding_end_date')
        if funding_open_date and funding_end_date and funding_open_date > funding_end_date:
            raise serializers.ValidationError(_('Funding open date cannot be later than funding end date.'))

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request is None:
            raise KeyError("The 'request' context is not available.")
        
        user = request.user
        validated_data['created_by'] = user
        validated_data['updated_by'] = user
        return super().create(validated_data)