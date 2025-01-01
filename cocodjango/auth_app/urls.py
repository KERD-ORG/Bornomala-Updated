from django.urls import path
from .views import LoginView
from . import views
from . import otp_views

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('login/lockout/', views.lockout_response, name='login'),
    path('login/ip_check/', views.check_ip_block, name='login'),
    path('register/', views.register, name='register'),
    path('activate/<uidb64>/<token>/', views.activate_account, name='activate_account'),
    path('roles/', views.list_roles, name='list_roles'),
    path('user_info/', views.user_info, name='user_info'),
    path('logout/', views.logout_view, name='logout_view'),
    path('user_permissions/', views.user_permissions, name='user_permissions'),
    path('password_reset/', views.request_password_reset, name='request_password_reset'),
    path('password_reset_confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('password_reset_validate_token/', views.validate_password_reset_token, name='validate_password_reset_token'),
    path('setup_otp/', otp_views.setup_otp, name='setup_otp'),
    path('verify_otp/', otp_views.verify_otp, name='verify_otp'),
    path('check_otp_setup/', otp_views.check_otp_setup, name='check_otp_setup'),
    path('disable_otp/', otp_views.disable_otp, name='disable_otp'),
]
