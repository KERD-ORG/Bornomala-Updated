# urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('subscribe/', subscribe_to_newsletter, name='subscribe_to_newsletter'),
]
