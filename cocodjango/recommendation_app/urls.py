from django.urls import path
from .views import EmbedUserDataView
from .views import RecommendUniversitiesView

urlpatterns = [
    path('embed_user_data/', EmbedUserDataView.as_view(), name='embed_user_data'),
     path('recommend/', RecommendUniversitiesView.as_view(), name='recommend_view'),
    # other paths...
]
 