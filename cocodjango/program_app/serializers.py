from rest_framework import serializers
from .models import Program, Document
from django.core.files.storage import default_storage  
from django.utils.translation import gettext_lazy as _
import datetime

class ProgramSerializer(serializers.ModelSerializer):
    
    required_documents_urls = serializers.SerializerMethodField()

    required_documents_ids = serializers.PrimaryKeyRelatedField(
        queryset=Document.objects.all(), source='required_documents', many=True, write_only=True, required=False
    )

    department_name = serializers.CharField(
        source='department.name', read_only=True
    )

    class Meta:
        model = Program
        fields = [
            'id', 'title', 'description', 'eligibility_criteria', 'required_documents', 'required_documents_urls',
            'required_documents_ids', 'application_process', 'application_start_date', 'application_end_date',
            'application_fee', 'entrance_exam_details', 'exam_date', 'interview_process', 'financial_aid_details',
            'contact_email', 'contact_phone', 'contact_office_location', 'created_by', 'updated_by',
            'created_at', 'updated_at', 'department','department_name','status'
        ]
        extra_kwargs = {
            'required_documents': {'required': False},
            'entrance_exam_details': {'required': False},
            'exam_date': {'required': False},
            'interview_process': {'required': False},
            'financial_aid_details': {'required': False},
        }
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']

    
    def get_required_documents_urls(self, obj):
        documents = obj.required_documents.all()
        document_urls = []
        for document in documents:
            if document.file_name_system:
                
                url = default_storage.url(document.file_name_system)
                document_urls.append(url)
        return document_urls

    
    # def validate_application_start_date(self, value):
    #     if value < datetime.date.today():
    #         raise serializers.ValidationError(_("The application start date cannot be in the past."))
    #     return value

    # def validate_application_end_date(self, value):
    #     if value < datetime.date.today():
    #         raise serializers.ValidationError(_("The application end date cannot be in the past."))
    #     return value

    
    def validate(self, data):
        application_start_date = data.get('application_start_date')
        application_end_date = data.get('application_end_date')

        if application_start_date and application_end_date:
            if application_end_date < application_start_date:
                raise serializers.ValidationError({
                    'application_end_date': _("The application end date must be after the start date.")
                })

        return data

    
    def validate_application_fee(self, value):
        if value < 0:
            raise serializers.ValidationError(_("The application fee cannot be negative."))
        return value

    
    def validate_contact_phone(self, value):
        if len(value) < 10:
            raise serializers.ValidationError(_("Contact phone number must be at least 10 digits long."))
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request is None:
            raise KeyError("The 'request' context is not available.")
        
        user = request.user
        validated_data['created_by'] = user
        validated_data['updated_by'] = user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request is None:
            raise KeyError("The 'request' context is not available.")
        
        user = request.user
        validated_data['updated_by'] = user
        return super().update(instance, validated_data)
    
# from rest_framework import serializers
# from .models import ProgramDraft, Document
# from django.core.files.storage import default_storage
# from django.utils.translation import gettext_lazy as _
# from utils import upload_file
# import os
# from django.conf import settings

# class ProgramDraftSerializer(serializers.ModelSerializer):
#     required_documents_ids = serializers.PrimaryKeyRelatedField(
#         queryset=Document.objects.all(),
#         source='required_documents',
#         many=True,
#         write_only=True,
#         required=False,
#         allow_null=True  # Allow null for optional field
#     )

#     required_documents_urls = serializers.SerializerMethodField()

#     class Meta:
#         model = ProgramDraft
#         fields = [
#             'id', 'user', 'title', 'description', 'eligibility_criteria', 'required_documents',
#             'required_documents_ids', 'required_documents_urls', 'application_process',
#             'application_start_date', 'application_end_date', 'application_fee',
#             'entrance_exam_details', 'exam_date', 'interview_process', 'financial_aid_details',
#             'contact_email', 'contact_phone', 'contact_office_location', 'created_at', 'updated_at'
#         ]
#         extra_kwargs = {
#             'application_fee': {'required': False, 'allow_null': True},
#             'contact_email': {'required': False, 'allow_null': True},
#             'required_documents': {'required': False},
#         }
#         read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'required_documents_urls']

#     def get_required_documents_urls(self, obj):
#         documents = obj.required_documents.all()
#         document_urls = []
#         for document in documents:
#             if document.file_name_system:
#                 url = default_storage.url(document.file_name_system)
#                 document_urls.append(url)
#         return document_urls

#     def create(self, validated_data):
#         user = self.context['request'].user
#         # Remove existing draft and associated documents/files
#         existing_draft = ProgramDraft.objects.filter(user=user).first()
#         if existing_draft:
#             self._delete_previous_draft(existing_draft)

#         # Handle required_documents if provided
#         required_documents = validated_data.pop('required_documents', [])
#         draft = ProgramDraft.objects.create(user=user, **validated_data)
#         draft.required_documents.set(required_documents)

#         return draft

#     def update(self, instance, validated_data):
#         required_documents = validated_data.pop('required_documents', None)
#         instance = super().update(instance, validated_data)
#         if required_documents is not None:
#             instance.required_documents.set(required_documents)
#         return instance

#     def _delete_previous_draft(self, draft):
#         # Delete associated documents and files
#         documents = draft.required_documents.all()
#         for document in documents:
#             file_path = document.file_name_system
#             if file_path:
#                 full_path = os.path.join(settings.MEDIA_ROOT, file_path)
#                 if os.path.exists(full_path):
#                     os.remove(full_path)
#             document.delete()
#         draft.delete()

#     # Override the initialization to make all fields not required
#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
#         for field in self.fields:
#             self.fields[field].required = False
#             self.fields[field].allow_null = True  # Allow fields to be null
