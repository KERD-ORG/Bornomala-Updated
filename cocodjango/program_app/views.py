import json
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db import transaction
from django.core.exceptions import ValidationError, FieldError
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.db.models import Q
from rest_framework import status, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from utils import get_user_info_data

import os

from .models import Program, Document
from .serializers import ProgramSerializer
from utils import (
    delete_uploaded_files,
    upload_file,
    log_request,
    get_response_template
)
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES


def get_error_response(message, status_code, error_code=None, details=None):
    response_data = get_response_template()
    response_data.update({
        'status': 'error',
        'message': message,
        'error_code': error_code,
        'details': details,
    })
    return Response(response_data, status=status_code)



# Views

class ProgramView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request, pk=None):
        response_data = get_response_template()

        if pk:
            program = get_object_or_404(Program, pk=pk, deleted_at__isnull=True)
            serializer = ProgramSerializer(program)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Program record retrieved successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 50))
            sort_columns_param = request.GET.get('sortColumns', '')
            sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else ['-created_at']
            search_term = request.GET.get('searchTerm', '')

            program_data = Program.objects.filter(deleted_at__isnull=True)
            
            user_data = get_user_info_data(request.user)
            organization_id = user_data["organization"]["id"] if user_data["organization"] else None
            if organization_id:
                program_data = program_data.filter(department__college__campus__educational_organization__id=organization_id)
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
                q_objects = Q(title__icontains=search_term) | Q(description__icontains=search_term) | Q(department__name__icontains=search_term) |  \
                            Q(eligibility_criteria__icontains=search_term) | Q(application_process__icontains=search_term) | \
                            Q(contact_email__icontains=search_term) | Q(contact_phone__icontains=search_term) | \
                            Q(contact_office_location__icontains=search_term) | Q(entrance_exam_details__icontains=search_term) | \
                            Q(interview_process__icontains=search_term) | Q(financial_aid_details__icontains=search_term)
                program_data = program_data.filter(q_objects)

            try:
                program_data = program_data.distinct()
                program_data = program_data.order_by(*sort_columns)
            except FieldError as e:
                return get_error_response(
                    message=str(e),
                    status_code=status.HTTP_400_BAD_REQUEST,
                    error_code='BAD_REQUEST'
                )

            program_data_page = program_data[offset:offset + limit]

            if program_data_page:
                serializer = ProgramSerializer(program_data_page, many=True)
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': _('Program records retrieved successfully.')
                })
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return get_error_response(
                    message=GLOBAL_ERROR_MESSAGES['no_records_found'],
                    status_code=status.HTTP_404_NOT_FOUND,
                    error_code='RESOURCE_NOT_FOUND'
                )

    @transaction.atomic
    def post(self, request):
        log_request("POST", "ProgramView", request)
        response_data = get_response_template()
        data=request.data.copy()
        document_files = request.FILES.getlist('document_files',None)
        if 'required_documents' in data: del data['required_documents']
        # existing_doc_id_str = request.POST.get('required_documents', None)  
        # if existing_doc_id_str:     existing_doc_id = [int(id) for id in existing_doc_id_str.split(',')]     
        # else:    existing_doc_id = []
        serializer = ProgramSerializer(data=data, context={'request': request})
        # print("existing doc ",request.data)
        try:
            if serializer.is_valid():
                program_instance = serializer.save(created_by=request.user, updated_by=request.user)
                # existing_draft = ProgramDraft.objects.filter(user=request.user).first()
                # if existing_draft:
                #     delete_draft_and_documents(existing_draft,existing_doc_id)
                document_ids=[]
                if document_files:
                    document_ids = handle_document_files(document_files, request.user)
                # if existing_doc_id:
                #     document_ids+= existing_doc_id
                # print("doc id with existing ",document_ids,type(document_ids))
                if document_ids:
                    program_instance.required_documents.add(*document_ids)

                response_data.update({
                    'status': 'success',
                    'message': 'Program created successfully.',
                    'data': ProgramSerializer(program_instance).data,
                })
                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                response_data.update({
                    'status': 'error',
                    'message': 'Validation failed.',
                    'details': serializer.errors,
                })
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return get_error_response(
                message='Validation error occurred.',
                status_code=status.HTTP_400_BAD_REQUEST,
                details=str(e)
            )
        except Exception as e:
            return get_error_response(
                message='An error occurred.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details=str(e)
            )

    @transaction.atomic
    def put(self, request, pk):
        log_request("PUT", "ProgramView", request)
        response_data = get_response_template()
        data=request.data.copy()
        document_files = request.FILES.getlist('document_files',None)
        existing_doc_id_str = request.POST.get('required_documents', None)  
        if 'required_documents' in data: del data['required_documents']
        if existing_doc_id_str:     existing_doc_id = [int(id) for id in existing_doc_id_str.split(',')]     
        else:    existing_doc_id = []
        program = get_object_or_404(Program, pk=pk)
        serializer = ProgramSerializer(program, data=data, context={'request': request},partial=True)

        try:
            if serializer.is_valid():
                previous_document_ids = list(program.required_documents.values_list('id', flat=True))
                program_instance = serializer.save(updated_by=request.user) 
                document_ids=[]     
                document_files = request.FILES.getlist('document_files')
                if document_files:
                    document_ids = handle_document_files(document_files, request.user)
                
                remove_previous_documents(previous_document_ids, existing_doc_id)
                if existing_doc_id:
                    document_ids+= existing_doc_id
                if document_ids:
                    program_instance.required_documents.add(*document_ids)

                response_data.update({
                    'status': 'success',
                    'message': 'Program updated successfully.',
                    'data': ProgramSerializer(program_instance).data,
                })
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                response_data.update({
                    'status': 'error',
                    'message': 'Validation failed.',
                    'details': serializer.errors,
                })
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return get_error_response(
                message='Validation error occurred.',
                status_code=status.HTTP_400_BAD_REQUEST,
                details=str(e)
            )
        except Exception as e:
            return get_error_response(
                message='An error occurred.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details=str(e)
            )

    @transaction.atomic
    def delete(self, request, pk):
        response_data = get_response_template()
        program = get_object_or_404(Program, pk=pk)  
        document_ids = list(program.required_documents.values_list('id', flat=True))
        remove_documents_and_files(document_ids)
        program.delete()
        response_data.update({
            'status': 'success',
            'message': 'Program deleted successfully.',
        })
        return Response(response_data, status=status.HTTP_200_OK)



def handle_document_files( document_files, user):
    document_ids = []
    for document_file in document_files:
        file_upload_success, response = upload_file(
            document_file,
            use='sop',
            user=user,
            allowed_types=['.pdf', '.jpg', '.jpeg', '.png', '.docx'],
            return_file_path=False
        )
        if file_upload_success:
            document_ids.append(response['user_document_id'])
        else:
            raise ValidationError({'document_files': _('File upload failed.')})
    return document_ids

def remove_previous_documents( previous_document_ids, existing_doc_id):
    # current_document_ids = [doc.id for doc in current_documents]
    documents_to_remove_ids = set(previous_document_ids) - set(existing_doc_id)
    remove_documents_and_files(documents_to_remove_ids)

def delete_draft_and_documents(draft,existing_doc_id=[]):
    document_ids = list(draft.required_documents.values_list('id', flat=True))
    document_ids_to_delete = [doc_id for doc_id in document_ids if doc_id not in existing_doc_id]
    remove_documents_and_files(document_ids_to_delete)
    draft.delete()

def remove_documents_and_files(document_ids_to_remove):
    documents_to_remove = Document.objects.filter(id__in=document_ids_to_remove)
    for document in documents_to_remove:
        file_path = document.file_name_system
        if file_path:
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
        document.delete()


# class ProgramDraftView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def get_object(self):
#         try:
#             return self.user.program_draft
#         except ProgramDraft.DoesNotExist:
#             raise Http404

#     def get(self, request):
#         response_data = get_response_template()
#         try:
#             self.user= request.user
#             print(self.user)
#             draft = self.get_object()
#             serializer = ProgramDraftSerializer(draft)
#             response_data.update({
#                 'status': 'success',
#                 'message': 'Draft retrieved successfully.',
#                 'data': serializer.data,
#             })
#             return Response(response_data, status=status.HTTP_200_OK)
#         except Http404:
#             return get_error_response(
#                 message='No draft found.',
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 error_code='RESOURCE_NOT_FOUND'
#             )

#     @transaction.atomic
#     def post(self, request):
#         response_data = get_response_template()
#         user = request.user
#         data= request.data.copy()
#         document_files = request.FILES.getlist('document_files',None)
#         existing_doc_id_str = request.POST.get('required_documents', None)  
#         if existing_doc_id_str:     existing_doc_id = [int(id) for id in existing_doc_id_str.split(',')]     
#         else:    existing_doc_id = []
        
#         if 'id' in data: del data['id']
#         if 'required_documents' in data: del data['required_documents']
#         if 'user' in data: del data['user']
#         print(existing_doc_id,"hello", data) 
#         serializer = ProgramDraftSerializer(data=data, context={'request': request})
#         if serializer.is_valid():
#             try:
#                 existing_draft=None
#                 existing_draft =  ProgramDraft.objects.filter(user_id=user.id).first()
#                 print(existing_draft)
#                 if existing_draft:
#                     delete_draft_and_documents(existing_draft,existing_doc_id)
#                     print( ProgramDraft.objects.filter(user=user).first())
#                 draft = serializer.save()
#                 document_ids=[]
#                 if document_files:
#                     document_ids = handle_document_files(document_files, user)
#                 print(document_ids,type(document_ids))
#                 if existing_doc_id:
#                     document_ids+= existing_doc_id
#                 if document_ids:
#                     draft.required_documents.add(*document_ids)
#                 response_data.update({
#                     'status': 'success',
#                     'message': 'Draft created successfully.',
#                     'data': ProgramDraftSerializer(draft).data,
#                 })
#                 return Response(response_data, status=status.HTTP_201_CREATED)
#             except ValidationError as e:
#                 return get_error_response(
#                     message='Validation error occurred.',
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     details=e.message_dict
#                 )
#             except Exception as e:
#                 return get_error_response(
#                     message='An error occurred.',
#                     status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                     details=str(e)
#                 )
#         response_data.update({
#             'status': 'error',
#             'message': 'Validation failed.',
#             'details': serializer.errors,
#         })
#         return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

#     @transaction.atomic
#     def put(self, request):
#         response_data = get_response_template()
#         try:
#             draft = self.get_object()
#             previous_document_ids = list(draft.required_documents.values_list('id', flat=True))
#             document_files = request.FILES.getlist('document_files')
#             serializer = ProgramDraftSerializer(draft, data=request.data, context={'request': request})
#             if serializer.is_valid():
#                 try:
#                     draft = serializer.save()
#                     if document_files:
#                         document_ids = handle_document_files(document_files, request.user)
#                         draft.required_documents.add(*document_ids)
#                     remove_previous_documents(previous_document_ids, draft.required_documents.all())
#                     response_data.update({
#                         'status': 'success',
#                         'message': 'Draft updated successfully.',
#                         'data': ProgramDraftSerializer(draft).data,
#                     })
#                     return Response(response_data, status=status.HTTP_200_OK)
#                 except ValidationError as e:
#                     return get_error_response(
#                         message='Validation error occurred.',
#                         status_code=status.HTTP_400_BAD_REQUEST,
#                         details=e.message_dict
#                     )
#                 except Exception as e:
#                     return get_error_response(
#                         message='An error occurred.',
#                         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                         details=str(e)
#                     )
#             response_data.update({
#                 'status': 'error',
#                 'message': 'Validation failed.',
#                 'details': serializer.errors,
#             })
#             return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
#         except Http404:
#             return get_error_response(
#                 message='No draft found to update.',
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 error_code='RESOURCE_NOT_FOUND'
#             )

#     @transaction.atomic
#     def patch(self, request):
#         response_data = get_response_template()
#         try:
#             draft = self.get_object()
#             previous_document_ids = list(draft.required_documents.values_list('id', flat=True))
#             document_files = request.FILES.getlist('document_files')
#             serializer = ProgramDraftSerializer(draft, data=request.data, partial=True, context={'request': request})
#             if serializer.is_valid():
#                 try:
#                     draft = serializer.save()
#                     if document_files:
#                         document_ids = handle_document_files(document_files, request.user)
#                         draft.required_documents.add(*document_ids)
#                     remove_previous_documents(previous_document_ids, draft.required_documents.all())
#                     response_data.update({
#                         'status': 'success',
#                         'message': 'Draft partially updated successfully.',
#                         'data': ProgramDraftSerializer(draft).data,
#                     })
#                     return Response(response_data, status=status.HTTP_200_OK)
#                 except ValidationError as e:
#                     return get_error_response(
#                         message='Validation error occurred.',
#                         status_code=status.HTTP_400_BAD_REQUEST,
#                         details=e.message_dict
#                     )
#                 except Exception as e:
#                     return get_error_response(
#                         message='An error occurred.',
#                         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                         details=str(e)
#                     )
#             response_data.update({
#                 'status': 'error',
#                 'message': 'Validation failed.',
#                 'details': serializer.errors,
#             })
#             return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
#         except Http404:
#             return get_error_response(
#                 message='No draft found to update.',
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 error_code='RESOURCE_NOT_FOUND'
#             )

#     @transaction.atomic
#     def delete(self, request):
#         response_data = get_response_template()
#         try:
#             draft = self.get_object()
#             delete_draft_and_documents(draft)
#             response_data.update({
#                 'status': 'success',
#                 'message': 'Draft deleted successfully.',
#             })
#             return Response(response_data, status=status.HTTP_200_OK)
#         except Http404:
#             return get_error_response(
#                 message='No draft found to delete.',
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 error_code='RESOURCE_NOT_FOUND'
#             )
