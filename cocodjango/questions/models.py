# models.py

from django.db import models
from django.utils.translation import gettext_lazy as _
from educational_organizations_app.models import EducationalOrganizations as Organization
from django.db.models import JSONField


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
    """
    Examples: MCQ_SINGLE, MCQ_MULTI, DESCRIPTIVE, TRUE_FALSE, etc.
    """
    name = models.CharField(max_length=50, unique=True)

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


class Question(models.Model):
    """
    The main Question entity with references to other models.
    - question_level: e.g., Admission Test, Class VI, etc.
    - target_organization: e.g., Comilla University
    - target_group: Science, Commerce, or Arts
    - target_subject: e.g., Physics
    - question_type: MCQ, Descriptive, etc.
    - topic / sub_topic / sub_sub_topic: hierarchical classification
    - exam_references: ManyToMany linking to multiple exam references (past usage)
    - question_status: 'New' or 'Reused'
    - difficulty_level: e.g., 'Moderate'
    """
    question_level = models.ForeignKey(
        QuestionLevel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    target_organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    target_group = models.ForeignKey(
        TargetGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    target_subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    question_type = models.ForeignKey(
        QuestionType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    sub_topic = models.ForeignKey(
        SubTopic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    sub_sub_topic = models.ForeignKey(
        SubSubTopic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    exam_references = models.ManyToManyField(
        ExamReference,
        blank=True,
        related_name="questions"
    )

    # Main content of the question
    question_text = models.TextField(
        _("Question Text"),
        help_text=_("Type your question here.")
    )

    # Additional details
    explanation = models.TextField(
        _("Explanation / Solution"),
        blank=True,
        null=True
    )
    correct_answer = JSONField(
        _("Correct Answer"),
        blank=True,
        null=True,
        help_text=_("Stores the correct answer(s) in a flexible format based on the question type.")
    )

    question_status = models.ForeignKey(
        QuestionStatus,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Status of the question, e.g., New, Approved, Rejected"
    )

    difficulty_level = models.ForeignKey(
        DifficultyLevel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[Q#{self.id}] {self.question_text[:60]}..."


class MCQOption(models.Model):
    """
    Stores multiple-choice options for a given Question (if it's an MCQ type).
    Each Question can have 2-8 options. This is optional for other question types.
    """
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='mcq_options'
    )
    option_text = models.CharField(max_length=255)

    def __str__(self):
        return f"Option (Q#{self.question.id}): {self.option_text}"
