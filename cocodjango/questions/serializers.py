# serializers.py
from .models import (
    QuestionLevel, TargetGroup, Subject,
    QuestionType, Topic, SubTopic, SubSubTopic,
    DifficultyLevel, QuestionStatus, ExamReference,
    MCQSingleQuestion, MCQMultiQuestion, FillInTheBlanksQuestion, TrueFalseQuestion,
    MatchingQuestion, OrderingQuestion, NumericalQuestion, ImageBasedQuestion,
    AudioVideoQuestion, CaseStudyQuestion, DiagramLabelingQuestion,
    CodeProgrammingQuestion, DragAndDropQuestion, AssertionReasonQuestion, Explanation, BaseQuestion

)
from educational_organizations_app.models import EducationalOrganizations as Organization
from rest_framework import serializers


class ExplanationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Explanation
        fields = ['id', 'level', 'text', 'video_url']


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


class BaseQuestionSerializer(serializers.ModelSerializer):
    explanations = ExplanationSerializer(many=True, required=False)
    exam_references = serializers.PrimaryKeyRelatedField(
        queryset=ExamReference.objects.all(), many=True, required=False
    )

    question_level = serializers.PrimaryKeyRelatedField(
        queryset=QuestionLevel.objects.all(), required=False, allow_null=True
    )
    target_group = serializers.PrimaryKeyRelatedField(
        queryset=TargetGroup.objects.all(), required=False, allow_null=True
    )
    target_subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), required=False, allow_null=True
    )
    question_type = serializers.SlugRelatedField(
        queryset=QuestionType.objects.all(),
        slug_field='name'
    )
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), required=False, allow_null=True
    )
    sub_topic = serializers.PrimaryKeyRelatedField(
        queryset=SubTopic.objects.all(), required=False, allow_null=True
    )
    sub_sub_topic = serializers.PrimaryKeyRelatedField(
        queryset=SubSubTopic.objects.all(), required=False, allow_null=True
    )
    difficulty_level = serializers.PrimaryKeyRelatedField(
        queryset=DifficultyLevel.objects.all(), required=False, allow_null=True
    )
    question_status = serializers.PrimaryKeyRelatedField(
        queryset=QuestionStatus.objects.all(), required=False, allow_null=True
    )

    target_organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = BaseQuestion
        fields = [
            'id', 'question_level', 'target_group', 'target_subject', 'question_type',
            'target_organization',
            'topic', 'sub_topic', 'sub_sub_topic', 'difficulty_level', 'question_status',
            'exam_references', 'explanations', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        explanations_data = validated_data.pop('explanations', [])
        exam_references_data = validated_data.pop('exam_references', [])

        # Create the base question instance
        question = self.Meta.model.objects.create(**validated_data)

        # Add explanations
        for explanation_data in explanations_data:
            explanation, _ = Explanation.objects.get_or_create(**explanation_data)
            question.explanations.add(explanation)

        # Add exam references
        if exam_references_data:
            question.exam_references.set(exam_references_data)

        return question

    def update(self, instance, validated_data):
        explanations_data = validated_data.pop('explanations', None)
        exam_references_data = validated_data.pop('exam_references', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if explanations_data is not None:
            instance.explanations.clear()
            for explanation_data in explanations_data:
                explanation, _ = Explanation.objects.get_or_create(**explanation_data)
                instance.explanations.add(explanation)

        if exam_references_data is not None:
            instance.exam_references.set(exam_references_data)

        return instance


# Serializers for each Question Type
class MCQSingleQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = MCQSingleQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'options', 'correct_answer']


class MCQMultiQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = MCQMultiQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'options', 'correct_answer']


class FillInTheBlanksQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = FillInTheBlanksQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'correct_answer']


class TrueFalseQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = TrueFalseQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'correct_answer']


class MatchingQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = MatchingQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'matching_pairs']


class OrderingQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = OrderingQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'ordering_sequence']


class NumericalQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = NumericalQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'correct_answer']


class ImageBasedQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = ImageBasedQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'image_url', 'correct_answer']


class AudioVideoQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = AudioVideoQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'audio_url', 'video_url',
                                                       'correct_answer']


class CaseStudyQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = CaseStudyQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'correct_answer']


class DiagramLabelingQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = DiagramLabelingQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'diagram_url', 'correct_answer']


class CodeProgrammingQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = CodeProgrammingQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'correct_answer']


class DragAndDropQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = DragAndDropQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'options_column_a', 'options_column_b',
                                                       'correct_answer']


class AssertionReasonQuestionSerializer(BaseQuestionSerializer):
    explanations = ExplanationSerializer(many=True, required=False)

    class Meta(BaseQuestionSerializer.Meta):
        model = AssertionReasonQuestion
        fields = BaseQuestionSerializer.Meta.fields + ['id', 'question_text', 'correct_answer']


class GenericQuestionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    question_type = serializers.SerializerMethodField()
    details = serializers.SerializerMethodField()

    _class_to_type = {
        'MCQSingleQuestion': 'MCQ_SINGLE',
        'MCQMultiQuestion': 'MCQ_MULTI',
        'FillInTheBlanksQuestion': 'FILL_BLANK',
        'TrueFalseQuestion': 'TRUE_FALSE',
        'MatchingQuestion': 'MATCHING',
        'OrderingQuestion': 'ORDERING',
        'NumericalQuestion': 'NUMERICAL',
        'ImageBasedQuestion': 'IMAGE',
        'AudioVideoQuestion': 'AUDIO_VIDEO',
        'CaseStudyQuestion': 'CASE_STUDY',
        'DiagramLabelingQuestion': 'DIAGRAM',
        'CodeProgrammingQuestion': 'CODE',
        'DragAndDropQuestion': 'DRAG_DROP',
        'AssertionReasonQuestion': 'ASSERTION_REASON'
    }

    def get_question_type(self, obj):
        class_name = obj.__class__.__name__
        question_type = self._class_to_type.get(class_name, class_name)
        print(f"Question type determined: {question_type}")
        return question_type

    def get_details(self, obj):
        """Get the question details using the appropriate serializer"""
        question_type = self.get_question_type(obj)
        print(f"Getting serializer for type: {question_type}")

        specific_serializer = QuestionSerializerFactory.get_serializer(question_type)
        print(f"Specific serializer found: {specific_serializer}")

        if specific_serializer:
            try:
                serialized_data = specific_serializer(obj, context=self.context).data
                print(f"Serialized data: {serialized_data}")
                return serialized_data
            except Exception as e:
                print(f"Error serializing {question_type}: {str(e)}")
                return {"error": str(e)}
        print(f"No serializer found for type: {question_type}")
        return {}


# Factory for Dynamic Serializer Selection
class QuestionSerializerFactory:
    _serializer_mapping = {
        'MCQ_SINGLE': MCQSingleQuestionSerializer,
        'MCQ_MULTI': MCQMultiQuestionSerializer,
        'FILL_BLANK': FillInTheBlanksQuestionSerializer,
        'TRUE_FALSE': TrueFalseQuestionSerializer,
        'MATCHING': MatchingQuestionSerializer,
        'ORDERING': OrderingQuestionSerializer,
        'NUMERICAL': NumericalQuestionSerializer,
        'IMAGE': ImageBasedQuestionSerializer,
        'AUDIO_VIDEO': AudioVideoQuestionSerializer,
        'CASE_STUDY': CaseStudyQuestionSerializer,
        'DIAGRAM': DiagramLabelingQuestionSerializer,
        'CODE': CodeProgrammingQuestionSerializer,
        'DRAG_DROP': DragAndDropQuestionSerializer,
        'ASSERTION_REASON': AssertionReasonQuestionSerializer
    }

    @classmethod
    def get_serializer(cls, question_type):
        """Get the appropriate serializer for a specific question type"""
        serializer = cls._serializer_mapping.get(question_type)
        print(f"Factory returning serializer for {question_type}: {serializer}")
        return serializer

    @classmethod
    def get_generic_serializer(cls):
        """Get the generic serializer that can handle all question types"""
        return GenericQuestionSerializer
