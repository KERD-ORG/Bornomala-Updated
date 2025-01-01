from django.core.exceptions import FieldError
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.models import UserDocument
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from utils import get_response_template
from utils import upload_file
from .messages import ERROR_MESSAGES, SUCCESS_MESSAGES
from .serializers import *
from .serializers import EducationalOrganizationsCategorySerializer,EducationalOrganizationsSerializer

from common.common_imports import *
from common import emails
from django.utils.text import slugify
from utils import get_user_info_data, has_custom_perm


class EducationalOrganizationsCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return EducationalOrganizationsCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except EducationalOrganizationsCategory.DoesNotExist:
            return None

    def get(self, request, pk=None):
        if pk:
            category = self.get_object(pk)
            if not category:
                return Response({'message': gettext_lazy('Educational organization category not found.')},
                                status=status.HTTP_404_NOT_FOUND)
            if not request.user.has_perm('educational_organizations_app.view_educationalorganizationscategory'):
                return Response({'message': gettext_lazy('You do not have permission to view this educational organization category')},
                                status=status.HTTP_403_FORBIDDEN)
            serializer = EducationalOrganizationsCategorySerializer(category)
        else:
            if not request.user.has_perm('educational_organizations_app.view_educationalorganizationscategory'):
                return Response({'message': gettext_lazy('You do not have permission to view educational organization categories')},
                                status=status.HTTP_403_FORBIDDEN)
            categories = EducationalOrganizationsCategory.objects.filter(deleted_at__isnull=True)
            serializer = EducationalOrganizationsCategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    @transaction.atomic
    def post(self, request):
        if not request.user.has_perm('educational_organizations_app.add_educationalorganizationscategory'):
            return Response({'message': gettext_lazy('You do not have permission to add an educational organization category')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = EducationalOrganizationsCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def put(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'message': gettext_lazy('Educational organization category not found.')},
                            status=status.HTTP_404_NOT_FOUND)
        if not request.user.has_perm('educational_organizations_app.change_educationalorganizationscategory'):
            return Response({'message': gettext_lazy('You do not have permission to update this educational organization category')},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = EducationalOrganizationsCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'message': gettext_lazy('Educational organization category not found.')},
                            status=status.HTTP_404_NOT_FOUND)
        if not request.user.has_perm('educational_organizations_app.delete_educationalorganizationscategory'):
            return Response({'message': gettext_lazy('You do not have permission to delete this educational organization category')},
                            status=status.HTTP_403_FORBIDDEN)
        category.deleted_at = timezone.now()
        category.save()
        return Response({'message': gettext_lazy('Educational organization category deleted successfully.')}, status=status.HTTP_204_NO_CONTENT)


class EducationalOrganizationView(APIView):

    def get(self, request, format=None):
        if not has_custom_perm(request.user, 'educational_organizations_app.view_educationalorganizations'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        log_request("GET", "EducationalOrganizationView", request)
        response_data = get_response_template()
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 50))
        sort_columns_param = request.GET.get('sortColumns', '')
        sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else []
        search_term = request.GET.get('searchTerm', '')

        log_request("GET", f"Query params: offset={offset}, limit={limit}, sortColumns={sort_columns}, searchTerm={search_term}", request)
        organizational_data = EducationalOrganizations.objects.all()
        
        user_data = get_user_info_data(request.user)
        organization_id = user_data["organization"]["id"] if user_data["organization"] else None
        if organization_id:
            organizational_data = organizational_data.filter(id=organization_id)
        elif 'roles' in user_data and user_data['roles']:
            pass
        else:
            response_data.update({
                'status': 'error',
                'message': 'Bad request was sent.',
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        if search_term:
            q_objects = Q(
                name__icontains=search_term
            ) | Q(
                web_address__icontains=search_term
            ) | Q(
                statement__icontains=search_term
            ) | Q(
                address_line1__icontains=search_term
            ) | Q(
                address_line2__icontains=search_term
            ) | Q(
                city__icontains=search_term
            ) | Q(
                postal_code__icontains=search_term
            )
            country_codes = [code for code, name in countries if search_term.lower() in name.lower()]
            q_objects |= Q(
                country_code__in=country_codes
            )
            q_objects |= Q(
                under_category__name__icontains=search_term
            ) | Q(
                state_province__name__icontains=search_term
            )

            organizational_data = organizational_data.filter(q_objects)

        # Default sorting by created_at descending if no sortColumns specified
        if not sort_columns:
            sort_columns = ['-created_at']

        try:
            organizational_data = organizational_data.order_by(*sort_columns)
        except FieldError as e:
            log_request_error("PUT", "[Organization Update] {e}", request)
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['organization_data_not_found'],
                'error_code': 'BAD_REQUEST',
            })
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        organizational_data_page = organizational_data[offset:offset + limit]

        if organizational_data_page:
            organizational_serialized_data = EducationalOrganizationsSerializer(organizational_data_page,context={'request': request},
                                                                                many=True).data

            for org in organizational_serialized_data:
                org['logo_url'] = default_storage.url(org['document_name']) if org['document_name'] else None

            response_data.update({
                'status': 'success',
                'data': organizational_serialized_data,
                'message': SUCCESS_MESSAGES['organization_data_found'],
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            log_request_error("PUT", "[Organization Create] no data matching found", request)
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['organization_data_not_found'],
                'error_code': 'RESOURCE_NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request, format=None):
        if not has_custom_perm(request.user, 'educational_organizations_app.add_educationalorganizations'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        log_request("POST", "EducationalOrganizationView", request)
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        organization_data = request.data  # Ensure request.data is used
        
        
        try:
            document_file = request.data.get('document_file', None)
            if 'document_file' in request.FILES and request.FILES['document_file'] is not None:
                content_type = document_file.content_type
                if not content_type.startswith('image/'):
                    status_code = status.HTTP_400_BAD_REQUEST
                    response_data.update({
                        'status': 'error',
                        'message': gettext_lazy('Only JPG, PNG, GIF image files are allowed.'),
                        'error_code': 'VALIDATION_ERROR',
                        'details': None
                    })
                    return Response(response_data, status=status_code)

            serializer_instance = EducationalOrganizationsSerializer(data=organization_data, context={'request': request, 'require_fields': False})
            if serializer_instance.is_valid():
                
                if 'document_file' in request.FILES and request.FILES['document_file'] is not None:
                    user = self.request.user
                    file_upload_success, file_upload_error = upload_file(
                        document_file, UserDocument.ORG_LOGO, user, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))

                    if not file_upload_success:
                        log_request_error("POST", "[Organization Create] file upload failed", request)
                        status_code = status.HTTP_400_BAD_REQUEST
                        response_data.update({
                            'status': 'error',
                            'message': gettext_lazy('File upload failed.'),
                            'error_code': 'VALIDATION_ERROR',
                            'details': None
                        })
                        return Response(response_data, status=status_code)

                    # Assuming upload_file_id retrieval logic is correct
                    upload_file_id = UserDocument.objects.filter(user=user, use=UserDocument.ORG_LOGO).latest(
                        'created_at').document.id
                    organization_data['document'] = upload_file_id

                    serializer_instance = EducationalOrganizationsSerializer(data=organization_data, context={'request': request,  'require_fields': False})

                    if serializer_instance.is_valid():
                        serializer_instance.save()

                    serializer_instance_data = serializer_instance.data
                    logo_url = default_storage.url(serializer_instance_data['document_name'])
                    serializer_instance_data['logo_url'] = logo_url

                else:
                    serializer_instance.save()  # Save the serializer without file upload
                    serializer_instance_data = serializer_instance.data

                response_data.update({
                    'status': 'success',
                    'data': serializer_instance_data,
                    'message': SUCCESS_MESSAGES['educational_organization_saved_success'],
                })
            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer_instance.errors
                })

        except ValidationError as e:
            log_request_error("POST", "[Organization Create] {e}", request)
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("Validation error occurred."),
                'error_code': 'VALIDATION_ERROR',
                'details': e.detail
            })
            status_code = status.HTTP_400_BAD_REQUEST

        return Response(response_data, status=status_code)

    @transaction.atomic
    def put(self, request, pk, format=None):
        if not has_custom_perm(request.user, 'educational_organizations_app.change_educationalorganizations'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        log_request("PUT", "EducationalOrganizationView", request)
        status_code = status.HTTP_200_OK
        response_data = get_response_template()
        organization_data = request.data  # Ensure request.data is used
        try:
            organization_instance = EducationalOrganizations.objects.get(pk=pk)
            document_file = request.data.get('document_file', None)
            if 'document_file' in request.FILES and request.FILES['document_file'] is not None:
                content_type = document_file.content_type
                if not content_type.startswith('image/'):
                    status_code = status.HTTP_400_BAD_REQUEST
                    response_data.update({
                        'status': 'error',
                        'message': gettext_lazy('Only JPG, PNG, GIF image files are allowed.'),
                        'error_code': 'VALIDATION_ERROR',
                        'details': None
                    })
                    return Response(response_data, status=status_code)

            serializer_instance = EducationalOrganizationsSerializer(
                instance=organization_instance,
                data=organization_data,
                partial=True,
                context={'request': request, 'require_fields': False}
            )

            if serializer_instance.is_valid():
                try:
                    if 'document_file' in request.FILES and request.FILES['document_file'] is not None:
                        user = self.request.user
                        file_upload_success, file_upload_error = upload_file(
                            document_file, UserDocument.ORG_LOGO, user,
                            max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE')))

                        if not file_upload_success:
                            log_request_error("PUT", "[Organization Update] file upload failed", request)
                            status_code = status.HTTP_400_BAD_REQUEST
                            response_data.update({
                                'status': 'error',
                                'message': gettext_lazy('File upload failed.'),
                                'error_code': 'VALIDATION_ERROR',
                                'details': None
                            })
                            return Response(response_data, status=status_code)
                        else:
                            upload_file_id = UserDocument.objects.filter(user=user, use=UserDocument.ORG_LOGO).latest(
                                'created_at').document.id
                            organization_data['document'] = upload_file_id
                            serializer_instance = EducationalOrganizationsSerializer(
                                instance=organization_instance,
                                data=organization_data,
                                context={'request': request, 'require_fields': False},
                                partial=True  # Allow partial updates
                            )
                            if serializer_instance.is_valid():
                                pass

                except Exception as e:
                    log_request_error("PUT", "[Organization Update] file upload error", request)
                    status_code = status.HTTP_400_BAD_REQUEST
                    response_data.update({
                        'status': 'error',
                        'message': gettext_lazy('File upload failed.'),
                        'error_code': 'VALIDATION_ERROR',
                        'details': None
                    })
                    return Response(response_data, status=status_code)

                serializer_instance.save()

                serializer_instance_data = serializer_instance.data
                logo_url = default_storage.url(serializer_instance_data['document_name'])
                serializer_instance_data['logo_url'] = logo_url
                
                
                send_approve_mail_req = request.data.get('send_approve_mail', 'false')
                
                if send_approve_mail_req == 'true' and organization_instance.email:
                    slug_url = slugify(organization_instance.name)
                    emails.send_approve_organization_email(organization_instance,slug_url)
                    

                response_data.update({
                    'status': 'success',
                    'data': serializer_instance_data,
                    'message': SUCCESS_MESSAGES['educational_organization_updated_success'],
                })
            else:
                status_code = status.HTTP_400_BAD_REQUEST
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
                    'error_code': 'VALIDATION_ERROR',
                    'details': serializer_instance.errors
                })

        except EducationalOrganizations.DoesNotExist:
            log_request_error("PUT", "[Organization Update] does not exist", request)
            status_code = status.HTTP_404_NOT_FOUND
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("Educational organization not found."),
                'error_code': 'NOT_FOUND',
            })

        except ValidationError as e:
            log_request_error("PUT", "[Organization Update] {e}", request)
            response_data.update({
                'status': 'error',
                'message': gettext_lazy("Validation error occurred."),
                'error_code': 'VALIDATION_ERROR',
                'details': e.detail
            })
            status_code = status.HTTP_400_BAD_REQUEST

        return Response(response_data, status=status_code)

    @transaction.atomic
    def delete(self, request, pk, format=None):
        if not has_custom_perm(request.user, 'educational_organizations_app.delete_educationalorganizations'):
            return Response({'message': _('You do not have permission to perform this operation.')}, status=status.HTTP_403_FORBIDDEN)
        
        log_request("DELETE", "EducationalOrganizationView", request)
        response_data = get_response_template()
        organization = get_object_or_404(EducationalOrganizations, pk=pk)

        try:
            organization.soft_delete()
            log_request("DELETE", "EducationalOrganizationView[deleted successfully]", request, pk)
            response_data.update({
                'status': 'success',
                'data': None,
                'message': gettext_lazy('Educational organization deleted successfully.'),
            })
            return Response(response_data, status=status.HTTP_200_OK)

        except EducationalOrganizations.DoesNotExist:
            #logger.error(f"Educational organization with pk={pk} does not exist. DELETE request by {user_info} at {timezone.now()}")
            log_request_error("DELETE", "[Organization Delete] Not found", request)
            response_data.update({
                'status': 'error',
                'message': ERROR_MESSAGES['organization_data_not_found'],
                'error_code': 'NOT_FOUND',
            })
            return Response(response_data, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            #logger.error(f"xred during DELETE request by {user_info} at {timezone.now()}: {e}")
            log_request_error("DELETE", "[Organization Delete] {e}", request)
            response_data.update({
                'status': 'error',
                'message': "",
                'error_code': 'INTERNAL_SERVER_ERROR',
            })
            return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

        