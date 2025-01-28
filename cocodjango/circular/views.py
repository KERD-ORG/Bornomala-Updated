from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .serializers import *
from rest_framework.parsers import MultiPartParser, FormParser

# Category APIs
class CircularCategoryAPIView(APIView):
    def get(self, request):
        categories = CircularCategory.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CircularCategoryDetailAPIView(APIView):
    def get(self, request, pk):
        category = get_object_or_404(CircularCategory, pk=pk)
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        category = get_object_or_404(CircularCategory, pk=pk)
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = get_object_or_404(CircularCategory, pk=pk)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Circular APIs
class CircularAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)  # enable file uploads

    def get(self, request):
        circulars = Circular.objects.all()
        category_id = request.query_params.get('category_id')
        if category_id:
            circulars = circulars.filter(category_id=category_id)
        serializer = CircularSerializer(circulars, many=True)
        return Response(serializer.data)

    def post(self, request):

        """
        Expected to receive multipart/form-data if attachment is included.
        """
        serializer = CircularSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CircularDetailAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)  # enable file uploads if you want to update the attachment

    def get(self, request, pk):
        circular = get_object_or_404(Circular, pk=pk)
        serializer = CircularSerializer(circular)
        return Response(serializer.data)

    def put(self, request, pk):
        circular = get_object_or_404(Circular, pk=pk)
        serializer = CircularSerializer(circular, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        circular = get_object_or_404(Circular, pk=pk)
        circular.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Subscription APIs
class SubscriptionAPIView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        subscriptions = Subscription.objects.filter(user_id=user_id)
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Notification APIs
class NotificationAPIView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        notifications = Notification.objects.filter(user_id=user_id)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnreadNotificationAPIView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        unread_notifications = Notification.objects.filter(user_id=user_id, read_status=False)
        serializer = NotificationSerializer(unread_notifications, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk)
        notification.read_status = True
        notification.save()
        return Response({"message": "Notification marked as read"}, status=status.HTTP_200_OK)


# Analytics APIs
class AnalyticsAPIView(APIView):
    def get(self, request):
        analytics = Analytics.objects.all()
        serializer = AnalyticsSerializer(analytics, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AnalyticsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IncrementViewsAPIView(APIView):
    def post(self, request, circular_id):
        analytics = Analytics.objects.filter(circular_id=circular_id).first()
        if not analytics:
            return Response({"error": "Analytics record not found."}, status=status.HTTP_404_NOT_FOUND)
        analytics.views_count += 1
        analytics.save()
        return Response({"message": "Views incremented", "views_count": analytics.views_count}, status=status.HTTP_200_OK)

class AttachmentAPIView(APIView):
    """
    API for listing and creating attachments.
    """

    def get(self, request):
        attachments = Attachment.objects.all()
        circular_id = request.query_params.get('circular_id')
        if circular_id:
            attachments = attachments.filter(circular_id=circular_id)
        serializer = AttachmentSerializer(attachments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AttachmentDetailAPIView(APIView):
    """
    API for retrieving, updating, and deleting a specific attachment.
    """

    def get(self, request, pk):
        attachment = get_object_or_404(Attachment, pk=pk)
        serializer = AttachmentSerializer(attachment)
        return Response(serializer.data)

    def put(self, request, pk):
        attachment = get_object_or_404(Attachment, pk=pk)
        serializer = AttachmentSerializer(attachment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        attachment = get_object_or_404(Attachment, pk=pk)
        attachment.delete()
        return Response({"message": "Attachment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class TagAPIView(APIView):
    """
    API for listing and creating tags.
    """

    def get(self, request):
        tags = Tag.objects.all()
        circular_id = request.query_params.get('circular_id')
        if circular_id:
            tags = tags.filter(circular_id=circular_id)
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TagDetailAPIView(APIView):
    """
    API for retrieving, updating, and deleting a specific tag.
    """

    def get(self, request, pk):
        tag = get_object_or_404(Tag, pk=pk)
        serializer = TagSerializer(tag)
        return Response(serializer.data)

    def put(self, request, pk):
        tag = get_object_or_404(Tag, pk=pk)
        serializer = TagSerializer(tag, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tag = get_object_or_404(Tag, pk=pk)
        tag.delete()
        return Response({"message": "Tag deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
