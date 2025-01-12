from django.urls import path
from .views import (
    OrganizationListCreateView, OrganizationRetrieveUpdateDestroyView,
    QuestionLevelListCreateView, QuestionLevelRetrieveUpdateDestroyView,
    TargetGroupListCreateView, TargetGroupRetrieveUpdateDestroyView,
    SubjectListCreateView, SubjectRetrieveUpdateDestroyView,
    QuestionTypeListCreateView, QuestionTypeRetrieveUpdateDestroyView,
    TopicListCreateView, TopicRetrieveUpdateDestroyView,
    SubTopicListCreateView, SubTopicRetrieveUpdateDestroyView,
    SubSubTopicListCreateView, SubSubTopicRetrieveUpdateDestroyView,
    DifficultyLevelListCreateView, DifficultyLevelRetrieveUpdateDestroyView,
    QuestionStatusListCreateView, QuestionStatusRetrieveUpdateDestroyView,
    ExamReferenceListCreateView, ExamReferenceRetrieveUpdateDestroyView,
    QuestionListCreateView, QuestionRetrieveUpdateDestroyView, upload,
presign_url,fake_upload, get_video
)

urlpatterns = [
    path('organizations/', OrganizationListCreateView.as_view(), name='org-list-create'),
    path('organizations/<int:pk>/', OrganizationRetrieveUpdateDestroyView.as_view(), name='org-detail'),

    path('question-levels/', QuestionLevelListCreateView.as_view(), name='qlevel-list-create'),
    path('question-levels/<int:pk>/', QuestionLevelRetrieveUpdateDestroyView.as_view(), name='qlevel-detail'),

    path('target-groups/', TargetGroupListCreateView.as_view(), name='tgroup-list-create'),
    path('target-groups/<int:pk>/', TargetGroupRetrieveUpdateDestroyView.as_view(), name='tgroup-detail'),

    path('subjects/', SubjectListCreateView.as_view(), name='subject-list-create'),
    path('subjects/<int:pk>/', SubjectRetrieveUpdateDestroyView.as_view(), name='subject-detail'),

    path('question-types/', QuestionTypeListCreateView.as_view(), name='qtype-list-create'),
    path('question-types/<int:pk>/', QuestionTypeRetrieveUpdateDestroyView.as_view(), name='qtype-detail'),

    path('topics/', TopicListCreateView.as_view(), name='topic-list-create'),
    path('topics/<int:pk>/', TopicRetrieveUpdateDestroyView.as_view(), name='topic-detail'),

    path('subtopics/', SubTopicListCreateView.as_view(), name='subtopic-list-create'),
    path('subtopics/<int:pk>/', SubTopicRetrieveUpdateDestroyView.as_view(), name='subtopic-detail'),

    path('subsubtopics/', SubSubTopicListCreateView.as_view(), name='subsubtopic-list-create'),
    path('subsubtopics/<int:pk>/', SubSubTopicRetrieveUpdateDestroyView.as_view(), name='subsubtopic-detail'),

    path('difficulty-levels/', DifficultyLevelListCreateView.as_view(), name='difficulty-list-create'),
    path('difficulty-levels/<int:pk>/', DifficultyLevelRetrieveUpdateDestroyView.as_view(), name='difficulty-detail'),

    path('question-statuses/', QuestionStatusListCreateView.as_view(), name='qstatus-list-create'),
    path('question-statuses/<int:pk>/', QuestionStatusRetrieveUpdateDestroyView.as_view(), name='qstatus-detail'),

    path('exam-references/', ExamReferenceListCreateView.as_view(), name='examref-list-create'),
    path('exam-references/<int:pk>/', ExamReferenceRetrieveUpdateDestroyView.as_view(), name='examref-detail'),

    path('questions/', QuestionListCreateView.as_view(), name='question-list-create'),
    path('questions/<int:pk>/', QuestionRetrieveUpdateDestroyView.as_view(), name='question-detail'),

    path('presign-url', presign_url, name='presign-url'),
    path('fake-upload', fake_upload, name='fake-upload'),

    path('upload/', upload, name='upload'),
    path('media/<str:filename>/', get_video, name='get_video'),
]
