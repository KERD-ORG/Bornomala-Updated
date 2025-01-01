from .models import ResearchExperience
from .serializers import ResearchExperienceSerializer
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from .models import UserDetails
from common.common_imports import *

class ResearchExperienceView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Get research experiences"),
        operation_description=gettext_lazy("Retrieve user's research experiences."),
        responses={
            200: openapi.Response('Success', ResearchExperienceSerializer(many=True)),
            401: openapi.Response(description="Unauthorized"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def get(self, request, format=None):
        log_request("GET", "ResearchExperience", request)
        response_data = get_response_template()
        user = request.user
        try:
            user_details = UserDetails.objects.get(user=user)
            research_experience = ResearchExperience.objects.filter(user_details=user_details)
            serializer = ResearchExperienceSerializer(research_experience, many=True)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                "message": gettext_lazy("Research experiences retrieved successfully."),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except UserDetails.DoesNotExist:
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @swagger_auto_schema(
        operation_summary=gettext_lazy("Add research experience"),
        operation_description=gettext_lazy("Add a new research experience."),
        request_body=ResearchExperienceSerializer,
        responses={
            201: openapi.Response("Created", ResearchExperienceSerializer),
            400: openapi.Response(description="Bad Request"),
            500: openapi.Response(description="Internal Server Error"),
        }
    )
    
    @transaction.atomic
    def post(self, request, format=None):
        log_request("POST", "ResearchExperience", request)
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            serializer = ResearchExperienceSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Research experience added successfully."),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Update research experience"),
        operation_description=gettext_lazy("Update an existing research experience."),
        request_body=ResearchExperienceSerializer,
        responses={
            200: openapi.Response("Updated", ResearchExperienceSerializer),
            400: openapi.Response(description="Bad Request"),
            404: openapi.Response(description="Not Found"),
        }
    )
    
    @transaction.atomic
    def put(self, request, pk, format=None):
        log_request("PUT", "ResearchExperience", request)
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            researchExperience = get_object_or_404(ResearchExperience, pk=pk, user_details=user_details)
            serializer = ResearchExperienceSerializer(researchExperience, data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Research experience updated successfully."),
                })
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': gettext_lazy('Validation error'),
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer.errors
                })

        except UserDetails.DoesNotExist:
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['user_details_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })

        except Exception as e:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('An error occurred while processing the request'),
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            })

        return Response(response_data, status=status_code)

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Delete research experience"),
        operation_description=gettext_lazy("Delete an existing research experience."),
        responses={
            204: openapi.Response(description="No Content"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def delete(self, request, pk, format=None):
        log_request("DELETE", "ResearchExperience", request)
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        researchExperience = get_object_or_404(ResearchExperience, pk=pk, user_details=user_details, deleted_at__isnull=True)
        researchExperience.delete()
        return Response({
            "status": "success",
            "message": gettext_lazy("Research experience deleted successfully."),
            "data": None
        }, status=status.HTTP_204_NO_CONTENT)