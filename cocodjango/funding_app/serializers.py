from datetime import datetime
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from common.models import Document
from .models import Funding, Benefit
from django.core.files.storage import default_storage


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

    funding_for_faculty_member_name = serializers.CharField(
        source='funding_for_faculty_member.user.username', read_only=True
    )
    funding_for_edu_org_name = serializers.CharField(
        source='funding_for_edu_org.name', read_only=True
    )
    funding_for_college_name = serializers.CharField(
        source= 'funding_for_college.name',read_only= True
    )
    funding_for_dept_name = serializers.CharField(
        source= 'funding_for_dept.name',read_only= True
    )
    funding_doc = serializers.PrimaryKeyRelatedField(
        queryset=Document.objects.all(),
        required=False,
        allow_null=True
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
    benefits = serializers.PrimaryKeyRelatedField(queryset=Benefit.objects.all(), many=True)
    # funding_doc_name = serializers.SerializerMethodField()
    # def get_funding_doc_name(self, obj):
    #     return obj.funding_doc.file_name_system if obj.funding_doc else None
    
    funding_doc_url =serializers.SerializerMethodField()
    def get_funding_doc_url(self, obj):
        if obj.funding_doc:
            return default_storage.url(obj.funding_doc.file_name_system)
        return None
    created_by_name= serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else None

    def get_updated_by_name(self, obj):
        return obj.updated_by.username if obj.updated_by else None
    class Meta:
        model = Funding
        fields = [
            'id',
            'funding_for', 'funding_for_edu_org', 'funding_for_edu_org_name', 'funding_for_faculty_member', 'funding_for_faculty_member_name', 'funding_for_other_name','funding_for_college','funding_for_college_name','funding_for_dept','funding_for_dept_name',
            'funding_type', 'funding_type_name',
            'amount','web_address',
            'amount_type', 'amount_type_name',
            'benefits', 'benefits_name',
            'funding_opportunity_for',
            'funding_open_date', 'funding_end_date', 'updated_at','created_by','updated_by','created_by_name','updated_by_name',
            'title_of_funding','number_of_positions_opening','description','funding_doc','funding_doc_url'
        ]

        read_only_fields = ['created_by', 'updated_by']

    # def validate_funding_doc(self, value):
    #     if value:
    #         content_type = value.content_type
    #         allowed_types = [
    #             'image/jpeg', 
    #             'image/png', 
    #             'image/gif', 
    #             'application/pdf', 
    #             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    #         ]
    #         if content_type not in allowed_types:
    #             raise serializers.ValidationError("Only JPG, PNG, GIF images, PDFs, and DOCX files are allowed.")
    #     return value
    

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
        funding_for = data.get('funding_for')

        funding_for = data.get('funding_for')
        user = self.context['request'].user

        """
        if funding_for == Funding.DEPARTMENT and not user.has_perm('funding_app.add_department_funding'):
            raise serializers.ValidationError(_("You do not have permission to add department funding."))
        
        if funding_for == Funding.COLLEGE and not user.has_perm('funding_app.add_college_funding'):
            raise serializers.ValidationError(_("You do not have permission to add college funding."))
        
        if funding_for == Funding.EDU_ORG and not user.has_perm('funding_app.add_edu_org_funding'):
            raise serializers.ValidationError(_("You do not have permission to add educational organization funding."))
        
        if funding_for == Funding.FACULTY and not user.has_perm('funding_app.add_faculty_funding'):
            raise serializers.ValidationError(_("You do not have permission to add faculty funding."))
        if funding_for == Funding.OTHERS and not user.has_perm('funding_app.add_others_funding'):
            raise serializers.ValidationError(_("You do not have permission to add faculty funding."))
        """

        if funding_for == Funding.EDU_ORG:
            if not data.get('funding_for_edu_org'):
                raise serializers.ValidationError({'funding_for_edu_org': _("Educational organization is required when funding_for is Educational Organization.")})
            data['funding_for_college'] = None
            data['funding_for_dept'] = None
            data['funding_for_faculty_member'] = None
            data['funding_for_other_name'] = None

        elif funding_for == Funding.COLLEGE:
            if not data.get('funding_for_college'):
                raise serializers.ValidationError({'funding_for_college': _("College is required when funding_for is College.")})
            data['funding_for_edu_org'] = None
            data['funding_for_dept'] = None
            data['funding_for_faculty_member'] = None
            data['funding_for_other_name'] = None

        elif funding_for == Funding.DEPARTMENT:
            if not data.get('funding_for_dept'):
                raise serializers.ValidationError({'funding_for_dept': _("Department is required when funding_for is Department.")})
            data['funding_for_edu_org'] = None
            data['funding_for_college'] = None
            data['funding_for_faculty_member'] = None
            data['funding_for_other_name'] = None

        elif funding_for == Funding.FACULTY:
            if not data.get('funding_for_faculty_member'):
                raise serializers.ValidationError({'funding_for_faculty_member': _("Faculty member is required when funding_for is Faculty.")})
            data['funding_for_edu_org'] = None
            data['funding_for_college'] = None
            data['funding_for_dept'] = None
            data['funding_for_other_name'] = None

        elif funding_for == Funding.OTHERS:
            if not data.get('funding_for_other_name'):
                raise serializers.ValidationError({'funding_for_other_name': _("Other funding_for name is required when funding_for is Other.")})
            data['funding_for_edu_org'] = None
            data['funding_for_college'] = None
            data['funding_for_dept'] = None
            data['funding_for_faculty_member'] = None

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
    
    def update(self,instance, validated_data):
        request = self.context.get('request')
        if request is None:
            raise KeyError("The 'request' context is not available.")
        
        user = request.user
        validated_data['updated_by'] = user
        if not self.instance:
            raise ValueError("Instance is not set on the serializer.")

        return super().update(instance, validated_data)