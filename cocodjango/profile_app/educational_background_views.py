from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import UserDetails,  EducationalBackground
from django.utils.translation import gettext_lazy
from django.shortcuts import get_object_or_404
from .serializers import  EducationalBackgroundSerializer
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
class EducationalBackgroundView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Get Educational Background"),
        operation_description=gettext_lazy("Retrieve user's educational background."),
        responses={
            200: openapi.Response('Success', EducationalBackgroundSerializer(many=True)),
            401: openapi.Response(description="Unauthorized"),
            404: openapi.Response(description="Not Found"),
        }
    )
    def get(self, request, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        educational_backgrounds = EducationalBackground.objects.filter(user_details=user_details, deleted_at__isnull=True)
        serializer = EducationalBackgroundSerializer(educational_backgrounds, many=True)
        # return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({
            "status": "success",
            "message": gettext_lazy("Educational backgrounds retrieved successfully."),
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Add Educational Background"),
        operation_description=gettext_lazy("Add a new educational background."),
        request_body=EducationalBackgroundSerializer,
        responses={
            201: openapi.Response("Created", EducationalBackgroundSerializer),
            400: openapi.Response(description="Bad Request"),
            500: openapi.Response(description="Internal Server Error"),
        }
    )
    @transaction.atomic
    def post(self, request, format=None):
        serializer = EducationalBackgroundSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            # return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response({
                "status": "success",
                "message": gettext_lazy("Educational background added successfully."),
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "status": "error",
            "error_code": "VALIDATION_ERROR",
            "message": gettext_lazy("Validation error occurred."),
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Update Educational Background"),
        operation_description=gettext_lazy("Update an existing educational background."),
        request_body=EducationalBackgroundSerializer,
        responses={
            200: openapi.Response("Updated", EducationalBackgroundSerializer),
            400: openapi.Response(description="Bad Request"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def put(self, request, pk, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        educational_background = get_object_or_404(EducationalBackground, pk=pk, user_details=user_details, deleted_at__isnull=True)
        serializer = EducationalBackgroundSerializer(educational_background, data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            # return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({
                "status": "success",
                "message": gettext_lazy("Educational background updated successfully."),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "status": "error",
            "error_code": "VALIDATION_ERROR",
            "message": gettext_lazy("Validation error occurred."),
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Delete Educational Background"),
        operation_description=gettext_lazy("Delete an existing educational background."),
        responses={
            204: openapi.Response(description="No Content"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def delete(self, request, pk, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        educational_background = get_object_or_404(EducationalBackground, pk=pk, user_details=user_details, deleted_at__isnull=True)
        educational_background.delete()
        # return Response(status=status.HTTP_204_NO_CONTENT) 
        return Response({
            "status": "success",
            "message": gettext_lazy("Educational background deleted successfully."),
            "data": None
        }, status=status.HTTP_204_NO_CONTENT)
    
class UpdateRankView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Update Ranks"),
        operation_description=gettext_lazy("Update the ranks of educational backgrounds."),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'ranked_items': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_OBJECT, properties={
                        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'rank': openapi.Schema(type=openapi.TYPE_INTEGER),
                    })
                )
            }
        ),
        responses={
            200: openapi.Response(description="Ranks updated"),
            400: openapi.Response(description="Bad Request"),
        }
    )
    @transaction.atomic
    def post(self, request, format=None):
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        ranked_items = request.data.get('ranked_items', [])
        try:
            for item in ranked_items:
                educational_background = EducationalBackground.objects.get(pk=item['id'], user_details=user_details)
                educational_background.rank = item['rank']
                educational_background.save()
            # return Response({"message": "Ranks updated"}, status=status.HTTP_200_OK)
            return Response({
                "status": "success",
                "message": gettext_lazy("Ranks updated successfully."),
                "data": None
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                "status": "error",
                "error_code": "RANK_UPDATE_ERROR",
                "message": gettext_lazy("An error occurred while updating ranks."),
                "details": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)