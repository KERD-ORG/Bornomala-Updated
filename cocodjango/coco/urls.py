"""
URL configuration for coco project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
""" 
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from rest_framework.authentication import TokenAuthentication

admin.site.site_header = "COCO Super Admin"
admin.site.site_title = "COCO Super Admin"
admin.site.index_title = "Welcome to COCO Super Admin"

schema_view = get_schema_view(
    openapi.Info(
        title="COCO API",
        default_version='v1',
        description="Join our platform to receive personalized suggestions, funding advice, and more based on your unique profile. Let's help you achieve your academic goals!",
        terms_of_service="",
        contact=openapi.Contact(email="kallolnaha@gmail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('admin/defender/', include('defender.urls')), 
    path("admin/", admin.site.urls),
    path('api/', include('auth_app.urls')),
    path('api/', include('educational_organizations_app.urls')),
    path('api/', include('campus_app.urls')),
    path('api/', include('college_app.urls')),
    path('api/', include('department_app.urls')),
    path("api/", include("funding_app.urls")),
    path('api/', include('faculty_members_app.urls')),
    path('api/', include('program_app.urls')),
    path('api/', include('university_app.urls')),
    path('api/', include('common.urls')),
    # path('api/', include('profile_app.urls')),
    path('api/', include('security.urls')), 
    path("api/", include("contact_app.urls")),
    # path('logs/', include('log_viewer.urls')),
    # path('rosetta/', include('rosetta.urls')),
    path('api/', include('user_app.urls')),
    # path('api/', include('text_extraction_app.urls')),
    # path('api/', include('recommendation_app.urls')),
    # path('sticky-note', include("django_admin_sticky_notes.urls")),
    path('api/', include('newsletter_app.urls')),
    path('api/', include('questions.urls')),
    path('api/', include('circular.urls')),
]
  
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
