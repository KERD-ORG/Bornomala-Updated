# serializers.py

from rest_framework import serializers
from .models import (
    Organization, QuestionLevel, TargetGroup, Subject,
    QuestionType, Topic, SubTopic, SubSubTopic,
    DifficultyLevel, QuestionStatus, ExamReference,
    Question, MCQOption
)


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name']


class QuestionLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionLevel
        fields = ['id', 'name']


class TargetGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TargetGroup
        fields = ['id', 'name']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']


class QuestionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionType
        fields = ['id', 'name']


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name']


class SubTopicSerializer(serializers.ModelSerializer):
    # Optionally display the Topic name or ID
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(),
        required=True
    )

    class Meta:
        model = SubTopic
        fields = ['id', 'name', 'topic']


class SubSubTopicSerializer(serializers.ModelSerializer):
    # Optionally display the SubTopic name or ID
    sub_topic = serializers.PrimaryKeyRelatedField(
        queryset=SubTopic.objects.all(),
        required=True
    )

    class Meta:
        model = SubSubTopic
        fields = ['id', 'name', 'sub_topic']


class DifficultyLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DifficultyLevel
        fields = ['id', 'name']


class QuestionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionStatus
        fields = ['id', 'name']


class ExamReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamReference
        fields = ['id', 'reference_name', 'year_of_exam']


class MCQOptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the MCQOption model. Each MCQ option belongs to one question.
    """
    class Meta:
        model = MCQOption
        fields = ['id', 'option_text']
        # 'question' is usually handled by the parent or in create logic.


class QuestionSerializer(serializers.ModelSerializer):
    """
    Main Question Serializer:
    - Links to other models via ForeignKey or ManyToMany
    - Demonstrates how to handle nested MCQOptions and exam_references
    """
    # ForeignKey fields:
    question_level = serializers.PrimaryKeyRelatedField(
        queryset=QuestionLevel.objects.all(), allow_null=True, required=False
    )
    target_organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), allow_null=True, required=False
    )
    target_group = serializers.PrimaryKeyRelatedField(
        queryset=TargetGroup.objects.all(), allow_null=True, required=False
    )
    target_subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), allow_null=True, required=False
    )
    question_type = serializers.PrimaryKeyRelatedField(
        queryset=QuestionType.objects.all(), allow_null=True, required=False
    )
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), allow_null=True, required=False
    )
    sub_topic = serializers.PrimaryKeyRelatedField(
        queryset=SubTopic.objects.all(), allow_null=True, required=False
    )
    sub_sub_topic = serializers.PrimaryKeyRelatedField(
        queryset=SubSubTopic.objects.all(), allow_null=True, required=False
    )
    question_status = serializers.PrimaryKeyRelatedField(
        queryset=QuestionStatus.objects.all(), allow_null=True, required=False
    )
    difficulty_level = serializers.PrimaryKeyRelatedField(
        queryset=DifficultyLevel.objects.all(), allow_null=True, required=False
    )

    # ManyToMany: references
    exam_references = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ExamReference.objects.all(),
        required=False
    )

    # Nested or “inline” MCQ options (many)
    mcq_options = MCQOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id', 'question_text', 'explanation', 'correct_answer',
            'question_level', 'target_organization', 'target_group',
            'target_subject', 'question_type', 'topic', 'sub_topic', 'sub_sub_topic',
            'exam_references', 'question_status', 'difficulty_level',
            'created_at', 'updated_at',
            'mcq_options'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Extract nested data (if any)
        mcq_options_data = validated_data.pop('mcq_options', [])
        exam_refs_data = validated_data.pop('exam_references', [])

        # Create the question
        question = Question.objects.create(**validated_data)

        # ManyToMany: exam_references
        question.exam_references.set(exam_refs_data)

        # Create MCQOption objects
        for option_data in mcq_options_data:
            MCQOption.objects.create(question=question, **option_data)

        return question

    def update(self, instance, validated_data):
        # For partial updates, ensure we handle nested data carefully
        mcq_options_data = validated_data.pop('mcq_options', None)
        exam_refs_data = validated_data.pop('exam_references', None)

        # Update direct fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update exam references if provided
        if exam_refs_data is not None:
            instance.exam_references.set(exam_refs_data)

        # Update MCQOptions if provided
        if mcq_options_data is not None:
            # One approach: clear existing options then recreate
            # or do more nuanced logic (update existing options, etc.)
            instance.mcq_options.all().delete()
            for option_data in mcq_options_data:
                MCQOption.objects.create(question=instance, **option_data)

        return instance
