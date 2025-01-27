from django.urls import path
from .views import *

urlpatterns = [
    path('circularcategories/', CircularCategoryAPIView.as_view(), name='category-list'),
    path('circularcategories/<int:pk>/', CircularCategoryDetailAPIView.as_view(), name='category-detail'),
    path('circulars/', CircularAPIView.as_view(), name='circular-list'),
    path('circulars/<int:pk>/', CircularDetailAPIView.as_view(), name='circular-detail'),
    path('subscriptions/', SubscriptionAPIView.as_view(), name='subscription-list'),
    path('notifications/', NotificationAPIView.as_view(), name='notification-list'),
    path('notifications/unread/', UnreadNotificationAPIView.as_view(), name='unread-notifications'),
    path('analytics/', AnalyticsAPIView.as_view(), name='analytics-list'),
    path('analytics/<int:circular_id>/increment/', IncrementViewsAPIView.as_view(), name='increment-views'),

    path('attachments/', AttachmentAPIView.as_view(), name='attachment-list'),
    path('attachments/<int:pk>/', AttachmentDetailAPIView.as_view(), name='attachment-detail'),
    path('tags/', TagAPIView.as_view(), name='tag-list'),
    path('tags/<int:pk>/', TagDetailAPIView.as_view(), name='tag-detail'),

]
