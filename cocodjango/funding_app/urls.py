from django.urls import path
from .views import *

urlpatterns = [
    path('funding/', FundingView.as_view(), name='funding'),
    path('funding/<int:pk>/', FundingView.as_view(), name='funding'),
    path('funding/benefit/', BenefitView.as_view()),
    path('funding/benefit/<int:pk>/', BenefitView.as_view()),
    path('funding_choices/', FundingForChoicesView.as_view(), name='funding-for-choices'),

]
