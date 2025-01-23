# models.py

from django.db import models
from django.utils.translation import gettext_lazy as _
from educational_organizations_app.models import EducationalOrganizations as Organization


class QuestionLevel(models.Model):
    """
    E.g., Primary School, Class VI, Class VII, Admission Test, etc.
    """
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class TargetGroup(models.Model):
    """
    E.g., Science, Commerce, Arts/Humanities.
    """
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Subject(models.Model):
    """
    E.g., Physics, Chemistry, Mathematics, English, etc.
    """
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class QuestionType(models.Model):

    QUESTION_TYPE_CHOICES = [
        ('MCQ_SINGLE', 'Multiple Choice (Single Answer)'),
        ('MCQ_MULTI', 'Multiple Choice (Multiple Answers)'),
        ('DESCRIPTIVE', 'Descriptive'),
        ('TRUE_FALSE', 'True or False'),
        ('FILL_BLANK', 'Fill in the Blank'),
        ('MATCHING', 'Matching'),
        ('ORDERING', 'Ordering/Sequence'),
        ('NUMERICAL', 'Numerical'),
        ('IMAGE', 'Image-Based'),
        ('AUDIO_VIDEO', 'Audio/Video-Based'),
        ('CASE_STUDY', 'Case Study'),
        ('DIAGRAM', 'Diagram Labeling'),
        ('CODE', 'Code/Programming'),
        ('DRAG_DROP', 'Drag and Drop'),
        ('ASSERTION_REASON', 'Assertion and Reason'),
    ]

    name = models.CharField(
        max_length=50,
        unique=True,
        choices=QUESTION_TYPE_CHOICES,
        help_text="Select the type of question."
    )

    def __str__(self):
        return self.name


class Topic(models.Model):
    """
    E.g., Optics, Algebra, Grammar, etc.
    """
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class SubTopic(models.Model):
    """
    Subtopics under a main Topic.
    """
    name = models.CharField(max_length=255)
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="sub_topics"
    )

    def __str__(self):
        return f"{self.topic.name} -> {self.name}"


class SubSubTopic(models.Model):
    """
    Optional deeper level. E.g., under 'Reflection' subtopic, you may have sub-sub topics.
    """
    name = models.CharField(max_length=255)
    sub_topic = models.ForeignKey(
        SubTopic,
        on_delete=models.CASCADE,
        related_name="sub_sub_topics"
    )

    def __str__(self):
        return f"{self.sub_topic.name} -> {self.name}"


class DifficultyLevel(models.Model):
    """
    E.g., Very Easy, Easy, Moderate, Tricky/Confusing, Application-Based, etc.
    """
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class QuestionStatus(models.Model):
    """
    E.g., 'New', 'Reused'.
    """
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class ExamReference(models.Model):
    """
    E.g., 'Comilla University' (2016), 'Dhaka University' (2013), etc.
    Multiple references can be linked to a single question.
    """
    reference_name = models.CharField(max_length=255)
    year_of_exam = models.CharField(max_length=4, blank=True, null=True)

    def __str__(self):
        if self.year_of_exam:
            return f"{self.reference_name} ({self.year_of_exam})"
        return self.reference_name


class Explanation(models.Model):
    """
    Model for storing explanations of different levels.
    """
    LEVEL_CHOICES = [
        ('Preliminary', 'Preliminary'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]

    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        help_text=_("The level of the explanation (Preliminary, Intermediate, Advanced).")
    )
    text = models.TextField(
        _("Text Explanation"),
        blank=True,
        null=True,
        help_text=_("Textual explanation for the question.")
    )
    video_url = models.URLField(
        _("Video Explanation"),
        blank=True,
        null=True,
        help_text=_("Optional video url for the explanation.")
    )

    def __str__(self):
        return f"{self.level} Explanation"


class BaseQuestion(models.Model):
    target_organization = models.ForeignKey(
        Organization,on_delete=models.SET_NULL,null=True,blank=True
    )

    question_level = models.ForeignKey(
        'QuestionLevel', on_delete=models.SET_NULL, null=True, blank=True
    )
    target_group = models.ForeignKey(
        'TargetGroup', on_delete=models.SET_NULL, null=True, blank=True
    )
    target_subject = models.ForeignKey(
        'Subject', on_delete=models.SET_NULL, null=True, blank=True
    )
    question_type = models.ForeignKey(
        'QuestionType', on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Select the question type."
    )
    topic = models.ForeignKey(
        'Topic', on_delete=models.SET_NULL, null=True, blank=True
    )
    sub_topic = models.ForeignKey(
        'SubTopic', on_delete=models.SET_NULL, null=True, blank=True
    )
    # sub_sub_topic = models.ForeignKey(
    #     'SubSubTopic', on_delete=models.SET_NULL, null=True, blank=True
    # )
    sub_sub_topic = models.ManyToManyField('SubSubTopic', blank=True, null=True)
    difficulty_level = models.ForeignKey(
        'DifficultyLevel', on_delete=models.SET_NULL, null=True, blank=True
    )
    question_status = models.ForeignKey(
        'QuestionStatus', on_delete=models.SET_NULL, null=True, blank=True
    )
    exam_references = models.ManyToManyField(
        'ExamReference', blank=True
    )
    explanations = models.ManyToManyField(Explanation, blank=True)

    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the question was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the question was last updated."
    )

    # created_by = models.ForeignKey(
    #     User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_questions',
    #     help_text="User who created the question."
    # )
    # approved_by = models.ForeignKey(
    #     User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_questions',
    #     help_text="User who approved the question."
    # )

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.question_type} Question"


class MCQSingleQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    options = models.JSONField()
    correct_answer = models.IntegerField()

    def __str__(self):
        return self.question_text[:50]


class MCQMultiQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    options = models.JSONField()
    correct_answer = models.JSONField()

    def __str__(self):
        return self.question_text[:50]


# Fill in the Blanks Question
class FillInTheBlanksQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    correct_answer = models.CharField(max_length=255)

    def __str__(self):
        return self.question_text[:50]


# True/False Question
class TrueFalseQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    correct_answer = models.BooleanField()

    def __str__(self):
        return self.question_text[:50]


# Matching Question
class MatchingQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    options_column_a = models.JSONField()
    options_column_b = models.JSONField()
    correct_answer = models.CharField(max_length=512)

    def __str__(self):
        return self.question_text[:50]


# Ordering/Sequence Question
class OrderingQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    ordering_sequence = models.JSONField()

    def __str__(self):
        return self.question_text[:50]


# Numerical/Calculation Question
class NumericalQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    correct_answer = models.FloatField()

    def __str__(self):
        return self.question_text[:50]


# Image-Based Question
class ImageBasedQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    image_url = models.URLField()
    correct_answer = models.CharField(max_length=255)

    def __str__(self):
        return self.question_text[:50]


# Audio/Video-Based Question
class AudioVideoQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    audio_url = models.URLField(blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    correct_answer = models.CharField(max_length=255)

    def __str__(self):
        return self.question_text[:50]


# Case Study Question
class CaseStudyQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    correct_answer = models.TextField()

    def __str__(self):
        return self.question_text[:50]


# Diagram Labeling Question
class DiagramLabelingQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    diagram_url = models.URLField()
    correct_answer = models.JSONField()

    def __str__(self):
        return self.question_text[:50]


# Code/Programming Question
class CodeProgrammingQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    correct_answer = models.TextField()

    def __str__(self):
        return self.question_text[:50]


# Drag-and-Drop Question
class DragAndDropQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    options_column_a = models.JSONField()
    options_column_b = models.JSONField()
    correct_answer = models.JSONField()

    def __str__(self):
        return self.question_text[:50]


# Assertion-Reason Question
class AssertionReasonQuestion(BaseQuestion):
    question_text = models.TextField(null=True, blank=True)
    correct_answer = models.TextField()

    def __str__(self):
        return self.question_text[:50]
