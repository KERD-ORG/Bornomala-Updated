from django.urls import path
from . import views

urlpatterns = [
    path('departments/', views.DepartmentView.as_view(), name='department-list'),
    path('departments/<int:pk>/', views.DepartmentView.as_view(), name='department-detail'),
]
