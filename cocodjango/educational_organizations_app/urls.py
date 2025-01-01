from django.urls import path
from .views import *
from .views import EducationalOrganizationView

urlpatterns = [
    path('educational_organizations/',
         EducationalOrganizationView.as_view(), name='educational_organization_view'),
    path('educational_organizations/<int:pk>/',
         EducationalOrganizationView.as_view(), name='educational_organization_delete_view'),
    
    path('categories/', EducationalOrganizationsCategoryView.as_view(), name='educational_organization_category_list'),
    path('categories/<int:pk>/', EducationalOrganizationsCategoryView.as_view(),
         name='educational_organization_category_detail'),

    path('organizations/', EducationalOrganizationView.as_view(), name='educational_organization_list'),
    path('organizations/<int:pk>/', EducationalOrganizationView.as_view(), name='educational_organization_detail'),

]
