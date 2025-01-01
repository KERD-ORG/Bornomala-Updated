# user_app/urls.py

from django.urls import path
from .views import *

urlpatterns = [
    path('users/', UserDetailsView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailsView.as_view(), name='user_detail'),
]
