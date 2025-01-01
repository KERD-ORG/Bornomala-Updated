# security/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('csp-report/', views.csp_report, name='csp-report'),
    path('csp_violation/', views.csp_violation, name='csp-violation'),
    # Add more paths as needed for other security-related views
]
