from django.urls import path
from .views import ResumeProcessView

urlpatterns = [
    path('process_resume/', ResumeProcessView.as_view(), name='process_resume'),
]