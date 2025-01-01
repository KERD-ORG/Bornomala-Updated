from .models import Publication
from .serializers import PublicationSerializer
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from .models import UserDetails
from common.common_imports import *

class PublicationView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary=gettext_lazy("Get Publications"),
        operation_description=gettext_lazy("Retrieve user's publications."),
        responses={
            200: openapi.Response('Success', PublicationSerializer(many=True)),
            401: openapi.Response(description="Unauthorized"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def get(self, request, format=None):
        log_request("GET", "PublicationView", request)
        response_data = get_response_template()
        user = request.user
        try:
            user_details = UserDetails.objects.get(user=user)
            publications = Publication.objects.filter(user_details=user_details)
            serializer = PublicationSerializer(publications, many=True)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                "message": gettext_lazy("Publications retrieved successfully."),
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
        operation_summary=gettext_lazy("Add Publication"),
        operation_description=gettext_lazy("Add a new publication."),
        request_body=PublicationSerializer,
        responses={
            201: openapi.Response("Created", PublicationSerializer),
            400: openapi.Response(description="Bad Request"),
            500: openapi.Response(description="Internal Server Error"),
        }
    )
    
    @transaction.atomic
    def post(self, request, format=None):
        log_request("POST", "PublicationView", request)
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            serializer = PublicationSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Publication added successfully."),
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
        operation_summary=gettext_lazy("Update Publication"),
        operation_description=gettext_lazy("Update an existing publication."),
        request_body=PublicationSerializer,
        responses={
            200: openapi.Response("Updated", PublicationSerializer),
            400: openapi.Response(description="Bad Request"),
            404: openapi.Response(description="Not Found"),
        }
    )
    
    @transaction.atomic
    def put(self, request, pk, format=None):
        log_request("PUT", "PublicationView", request)
        status_code = status.HTTP_200_OK
        response_data = get_response_template()

        try:
            user = request.user
            user_details = UserDetails.objects.get(user=user)
            publication = get_object_or_404(Publication, pk=pk, user_details=user_details)
            serializer = PublicationSerializer(publication, data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    "message": gettext_lazy("Publication updated successfully."),
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
        operation_summary=gettext_lazy("Delete Publication"),
        operation_description=gettext_lazy("Delete an existing publication."),
        responses={
            204: openapi.Response(description="No Content"),
            404: openapi.Response(description="Not Found"),
        }
    )
    @transaction.atomic
    def delete(self, request, pk, format=None):
        log_request("DELETE", "PublicationView", request)
        user = request.user
        user_details = get_object_or_404(UserDetails, user=user)
        publication = get_object_or_404(Publication, pk=pk, user_details=user_details, deleted_at__isnull=True)
        publication.delete()
        return Response({
            "status": "success",
            "message": gettext_lazy("Publication deleted successfully."),
            "data": None
        }, status=status.HTTP_204_NO_CONTENT)
        
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def publication_type_list(request):
    # Initialize response data using get_response_template
    response_data = get_response_template()
    try:
        # Create a list of dictionaries for publication types
        publication_types_data = [{'key': key, 'name': name} for key, name in Publication.PUBLICATION_TYPE_CHOICES]

        # Update response data with success status and publication types data
        response_data.update({
            'status': 'success',
            'message': gettext_lazy('Request processed successfully.'),
            'data': {
                'publication_types': publication_types_data
            }
        })
        return JsonResponse(response_data, status=status.HTTP_200_OK, safe=False)
    except Exception as e:
        # Update response data with general error details
        response_data.update({
            'status': 'error',
            'message': gettext_lazy('An error occurred while fetching the publication types list.'),
            'error_code': 'PUBLICATION_TYPES_LIST_ERROR',
            'details': str(e)
        })
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    