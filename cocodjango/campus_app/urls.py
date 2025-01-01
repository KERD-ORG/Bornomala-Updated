# urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('campus/', CampusView.as_view(), name='campus_list'),
    path('campus/<int:pk>/', CampusView.as_view(), name='campus_detail'),
]
