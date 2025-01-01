from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from utils import upload_file
from .models import TestScore, UserDocument, UserDetails
from django.core.files.storage import default_storage
import os

class TestScoreSerializer(serializers.ModelSerializer):
    user_details = serializers.HiddenField(default=serializers.CurrentUserDefault())
    user_document = serializers.PrimaryKeyRelatedField(
        queryset=UserDocument.objects.all(),
        required=False,
        allow_null=True
    )
    test_document = serializers.FileField(
        required=False,
        allow_null=True,
        error_messages={
            'invalid': _("Invalid file."),
            'required': _("File upload is required."),
            'null': _("Please upload a file."),
        }
    )
    
    file_name = serializers.SerializerMethodField()
    file_name_system = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    TEST_SCORE_RANGES = {
        'IELTS': (0, 9),
        'TOEFL': (0, 120),
        'SAT': (400, 1600),
        'GRE': (260, 340),
        'DUOLINGO': (10, 160),
        'PTE': (10, 90),
    }
    
    test_name = serializers.ChoiceField(choices=TestScore.TEST_CHOICES, error_messages={
        'invalid_choice': _("Invalid test name. Choose from IELTS, TOEFL, SAT, GRE, DUOLINGO, PTE.")
    })
    score = serializers.FloatField(error_messages={
        'required': _("Score is required."),
        'invalid': _("Invalid score."),
    })
    date_taken = serializers.DateField(error_messages={
        'required': _("Date taken is required."),
        'invalid': _("Invalid date."),
    })

    class Meta:
        model = TestScore
        fields = '__all__'
        read_only_fields = ('user_details',)

    def validate_test_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("Test Name is required."))
        return value

    def validate_score(self, value):
        test_name = self.initial_data.get('test_name')
        if test_name in self.TEST_SCORE_RANGES:
            min_score, max_score = self.TEST_SCORE_RANGES[test_name]
            if not (min_score <= value <= max_score):
                raise serializers.ValidationError(_(
                    f"Invalid score for {test_name}. Score should be between {min_score} and {max_score}."
                ))
        return value
    
    def get_file_name(self, obj):
        if obj.user_document and obj.user_document.document:
            return obj.user_document.document.file_name
        return None

    def get_file_name_system(self, obj):
        if obj.user_document and obj.user_document.document:
            return obj.user_document.document.file_name_system
        return None
    
    def get_file_url(self, obj):
        if obj.user_document and obj.user_document.document:
            return default_storage.url(obj.user_document.document.file_name_system)
        return None

    def create(self, validated_data):
        user = self.context['request'].user
        user_details = UserDetails.objects.get(user=user)
        validated_data['user_details'] = user_details
        
        try:
            test_document = validated_data.pop('test_document', None)
            if test_document:
                is_valid, result = upload_file(
                    test_document,
                    use=UserDocument.TEST_SCORE_DOCUMENT,
                    user=user,
                    max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE'))
                )
                if not is_valid:
                    raise serializers.ValidationError(result)
                else:
                    validated_data['user_document'] = UserDocument.objects.get(id=result['user_document_id'])
                
        except Exception as e:
            raise serializers.ValidationError(e)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        user = self.context['request'].user
        user_details = UserDetails.objects.get(user=user)
        validated_data['user_details'] = user_details
     
        try:
            test_document = validated_data.pop('test_document', None)
            if test_document:
                is_valid, result = upload_file(
                    test_document,
                    use=UserDocument.TEST_SCORE_DOCUMENT,
                    user=user,
                    max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE'))
                )
                if not is_valid:
                    raise serializers.ValidationError(result)
                else:
                    validated_data['user_document'] = UserDocument.objects.get(id=result['user_document_id'])
                
        except Exception as e:
            raise serializers.ValidationError(e)

        return super().update(instance, validated_data)
