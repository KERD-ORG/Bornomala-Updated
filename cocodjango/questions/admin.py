from django.contrib import admin
from .models import (
    QuestionLevel, TargetGroup, Subject, QuestionType,
    Topic, SubTopic, SubSubTopic, DifficultyLevel,
    QuestionStatus, ExamReference, Explanation, Question, MCQOption
)

# Registering each model
admin.site.register(QuestionLevel)
admin.site.register(TargetGroup)
admin.site.register(Subject)
admin.site.register(QuestionType)
admin.site.register(Topic)
admin.site.register(SubTopic)
admin.site.register(SubSubTopic)
admin.site.register(DifficultyLevel)
admin.site.register(QuestionStatus)
admin.site.register(ExamReference)
admin.site.register(Explanation)
admin.site.register(Question)
admin.site.register(MCQOption)
