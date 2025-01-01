from django.urls import path
from .views import CollegeView

urlpatterns = [
    path('colleges/', CollegeView.as_view(), name='colleges-list-create'),
    path('colleges/<int:pk>/', CollegeView.as_view(), name='colleges-detail')
]
