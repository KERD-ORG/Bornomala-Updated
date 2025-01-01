from django.urls import path
from .views import *

urlpatterns = [
    path('faculty_members/', FacultyMembersView.as_view(), name='faculty_members_list'),
    path('faculty_members/<int:pk>/', FacultyMembersView.as_view(), name='faculty_member_detail'),
]
