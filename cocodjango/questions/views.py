# views.py

from rest_framework import generics
from .models import (
    Organization, QuestionLevel, TargetGroup, Subject,
    QuestionType, Topic, SubTopic, SubSubTopic,
    DifficultyLevel, QuestionStatus, ExamReference,
    Question
)
from .serializers import (
    OrganizationSerializer, QuestionLevelSerializer, TargetGroupSerializer,
    SubjectSerializer, QuestionTypeSerializer, TopicSerializer,
    SubTopicSerializer, SubSubTopicSerializer, DifficultyLevelSerializer,
    QuestionStatusSerializer, ExamReferenceSerializer, QuestionSerializer
)

# -------------------------
# ORGANIZATION
# -------------------------
class OrganizationListCreateView(generics.ListCreateAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

class OrganizationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

# -------------------------
# QUESTION LEVEL
# -------------------------
class QuestionLevelListCreateView(generics.ListCreateAPIView):
    queryset = QuestionLevel.objects.all()
    serializer_class = QuestionLevelSerializer

class QuestionLevelRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuestionLevel.objects.all()
    serializer_class = QuestionLevelSerializer

# -------------------------
# TARGET GROUP
# -------------------------
class TargetGroupListCreateView(generics.ListCreateAPIView):
    queryset = TargetGroup.objects.all()
    serializer_class = TargetGroupSerializer

class TargetGroupRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TargetGroup.objects.all()
    serializer_class = TargetGroupSerializer

# -------------------------
# SUBJECT
# -------------------------
class SubjectListCreateView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

class SubjectRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

# -------------------------
# QUESTION TYPE
# -------------------------
class QuestionTypeListCreateView(generics.ListCreateAPIView):
    queryset = QuestionType.objects.all()
    serializer_class = QuestionTypeSerializer

class QuestionTypeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuestionType.objects.all()
    serializer_class = QuestionTypeSerializer

# -------------------------
# TOPIC
# -------------------------
class TopicListCreateView(generics.ListCreateAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer

class TopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer

# -------------------------
# SUBTOPIC
# -------------------------
class SubTopicListCreateView(generics.ListCreateAPIView):
    queryset = SubTopic.objects.all()
    serializer_class = SubTopicSerializer

class SubTopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubTopic.objects.all()
    serializer_class = SubTopicSerializer

# -------------------------
# SUBSUBTOPIC
# -------------------------
class SubSubTopicListCreateView(generics.ListCreateAPIView):
    queryset = SubSubTopic.objects.all()
    serializer_class = SubSubTopicSerializer

class SubSubTopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubSubTopic.objects.all()
    serializer_class = SubSubTopicSerializer

# -------------------------
# DIFFICULTY LEVEL
# -------------------------
class DifficultyLevelListCreateView(generics.ListCreateAPIView):
    queryset = DifficultyLevel.objects.all()
    serializer_class = DifficultyLevelSerializer

class DifficultyLevelRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DifficultyLevel.objects.all()
    serializer_class = DifficultyLevelSerializer

# -------------------------
# QUESTION STATUS
# -------------------------
class QuestionStatusListCreateView(generics.ListCreateAPIView):
    queryset = QuestionStatus.objects.all()
    serializer_class = QuestionStatusSerializer

class QuestionStatusRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuestionStatus.objects.all()
    serializer_class = QuestionStatusSerializer

# -------------------------
# EXAM REFERENCE
# -------------------------
class ExamReferenceListCreateView(generics.ListCreateAPIView):
    queryset = ExamReference.objects.all()
    serializer_class = ExamReferenceSerializer

class ExamReferenceRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExamReference.objects.all()
    serializer_class = ExamReferenceSerializer

# -------------------------
# QUESTION
# -------------------------
class QuestionListCreateView(generics.ListCreateAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class QuestionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
