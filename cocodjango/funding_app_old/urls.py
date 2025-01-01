from django.urls import path
from .views import FundingView,BenefitView

urlpatterns = [
    path('funding/', FundingView.as_view(), name='funding'),
    path('funding/<int:pk>/', FundingView.as_view(), name='funding'),
    path('funding/benefit/', BenefitView.as_view()),
    path('funding/benefit/<int:pk>/', BenefitView.as_view()),
]
