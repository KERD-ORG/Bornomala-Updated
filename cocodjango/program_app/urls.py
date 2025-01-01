from django.urls import path
from .views import *
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('programs/', ProgramView.as_view(), name='program-list-create'),
    path('programs/<int:pk>/', ProgramView.as_view(), name='program-detail'),
    # path('programs/draft/', ProgramDraftView.as_view(),name="get_draft_view"),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)