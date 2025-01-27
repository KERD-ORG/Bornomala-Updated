from rest_framework import serializers
from .models import *


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CircularCategory
        fields = ['id', 'name', 'description', 'parent_category']


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file_type', 'file_name', 'file_path', 'uploaded_date']


class CircularSerializer(serializers.ModelSerializer):
    # Include nested serializers for category and attachments
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=CircularCategory.objects.all(), source='category', write_only=True
    )
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Circular
        fields = [
            'id', 'title', 'category', 'category_id', 'description', 'organization_name',
            'publication_date', 'deadline', 'start_date', 'end_date', 'location',
            'eligibility_criteria', 'status', 'link_to_circular', 'attachments'
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'user', 'category', 'subscribed_date']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'circular', 'notification_text', 'sent_date', 'read_status']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'circular']


class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = ['id', 'circular', 'views_count', 'applications_count', 'last_viewed']
