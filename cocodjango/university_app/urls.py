from django.urls import path
from .views import university_list, university_create, university_detail

urlpatterns = [
    path('universities/', university_list, name='university_list'),
    path('universities/create/', university_create, name='university_create'),
    path('universities/<int:pk>/', university_detail, name='university_detail'),
]

