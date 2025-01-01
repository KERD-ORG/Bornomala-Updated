from django.urls import path
from .views import *
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('research_interests_options/', views.research_interests_options, name='research_interests_options'),
    path('skill_options/', views.skill_options, name='skill-options'),
    path('country_list/', views.country_list, name='country_list'),
    path('state_list/', views.state_list, name='state_list'),
    path('ethnicity_list/', views.ethnicity_list, name='ethnicity_list'),
    path('language_list/', views.language_list, name='language_list'),
    path('organization_category_list/', views.organization_category_list, name='organization_category_list'),
    
    path('geo_admin2/', geo_admin2_list, name='geo_admin2_list'),
    path('geo_admin2/<int:pk>/', geo_admin2_detail, name='geo_admin2_detail'),
    path('countries/<int:pk>/', country_detail, name='country_detail'),
    path('geo_admin1/', geo_admin1_list, name='geo_admin1_list'),
    path('geo_admin1/<int:pk>/', geo_admin1_detail, name='geo_admin1_detail'),
    path('upload_documents/', views.UploadFileView.as_view(), name='upload_documents'),
    path('upload_documents/<int:pk>/', views.UploadFileView.as_view(), name='upload_documents_'),
    path('countries/', countries_list, name='countries_list'),
    path('countries/<int:pk>/', country_detail, name='country_detail'),
    path('geo_admin1/', geo_admin1_list, name='geo_admin1_list'),
    path('geo_admin2/', geo_admin2_list, name='geo_admin2_list'),
    path('title_list/', views.title_list, name='title_list'),
    path('bulk_upload/', BulkUploadView.as_view(), name='file-upload'),
    path('clone_data/', clone_data, name='file-upload'),
    path('organization_detail/<slug:slug>/', views.organization_details, name='organization_detail'),
    path('organization_detail_post/', views.organization_details_post, name='organization_details_post'),
    
    path('static_data/',get_static_data,name='static_data_list'),
    path('chart_data/',get_chart_data,name='chart_data'),   
    path('server_health/', server_health, name='server_health'),
    path('logs/', log_view, name='log_analysis'),
    path('custom_groups/', views.custom_groups, name='custom_groups'),
    path('user_type_list/', views.user_type_list, name='user_type_list'),
    

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)