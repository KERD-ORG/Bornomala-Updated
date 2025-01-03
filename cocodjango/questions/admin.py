from django.contrib import admin
from .models import Question, QuestionLevel, TargetGroup, Subject

# Register your models here
admin.site.register(Question)
admin.site.register(QuestionLevel)
admin.site.register(TargetGroup)
admin.site.register(Subject)