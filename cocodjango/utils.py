import os
import uuid
from django.conf import settings
from common.models import Document, UserDocument
from common.serializers import DocumentSerializer, UserDocumentSerializer
from django.db import transaction
from global_messages import SUCCESS_MESSAGES as GLOBAL_SUCCESS_MESSAGES
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
import logging
import datetime
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from campus_app.serializers import CampusSerializer
from college_app.serializers import CollegeSerializer
from educational_organizations_app.models import EducationalOrganizations
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from campus_app.models import Campus
from campus_app.serializers import CampusSerializer
from college_app.models import College
from college_app.serializers import CollegeSerializer
from department_app.models import Department
from department_app.serializers import DepartmentSerializer
from department_app.serializers import DepartmentSerializer
from faculty_members_app.models import FacultyMembers
from auth_app.serializers import UserSerializer
from faculty_members_app.serializers import FacultyMembersSerializer

from django.core.files.storage import FileSystemStorage
import csv
import openpyxl
from rest_framework.response import Response

from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from campus_app.serializers import CampusSerializer
from college_app.serializers import CollegeSerializer
from educational_organizations_app.models import EducationalOrganizations
from educational_organizations_app.serializers import EducationalOrganizationsSerializer
from campus_app.models import Campus
from campus_app.serializers import CampusSerializer
from college_app.models import College
from college_app.serializers import CollegeSerializer
from department_app.models import Department
from department_app.serializers import DepartmentSerializer
from department_app.serializers import DepartmentSerializer
from faculty_members_app.models import FacultyMembers
from auth_app.serializers import UserSerializer
from faculty_members_app.serializers import FacultyMembersSerializer

from django.core.files.storage import FileSystemStorage
import csv
import openpyxl
from rest_framework.response import Response
from django.db.models import Q
from common.base_models import CustomGroup
from profile_app.models import UserDetails
from django.contrib.auth.models import Permission

logger = logging.getLogger(__name__)

def upload_file(data, use, user, allowed_types=None, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE_DEFAULT')), return_file_path=False):
    try:
        with transaction.atomic():
            if allowed_types is None:
                # Default to PDF if allowed_types is not provided
                allowed_types = ['.pdf', '.jpg', '.jpeg', '.png']
                allowed_types_pdf = ['.pdf']
                allowed_types_iamge = ['.jpg', '.jpeg', '.png']

            # Validate file type
            file_extension = os.path.splitext(data.name)[1].lower()
            if file_extension not in allowed_types:
                if use == 'sop' or use == 'resume':
                    return False, GLOBAL_ERROR_MESSAGES['invalid_extension'].format(extensions=", ".join(allowed_types_pdf))
                elif not use == 'image':
                    return False, GLOBAL_ERROR_MESSAGES['invalid_extension'].format(extensions=", ".join(allowed_types_iamge))
                

            # Validate file size
            max_size_bytes = max_size_mb * 1024 * 1024  # Convert MB to bytes
            system_max_size_bytes = int(
                os.getenv('MAX_FILE_UPLOAD_SIZE_DEFAULT')) * 1024 * 1024

            if data.size > system_max_size_bytes:
                return False, GLOBAL_ERROR_MESSAGES['exceeds_max_size']

            if data.size > max_size_bytes:
                return False, GLOBAL_ERROR_MESSAGES['exceeds_max_size']

            # Generate a unique file name
            unique_filename = f"{uuid.uuid4()}{file_extension}"

            # Define the full path to save the file
            file_path = os.path.join(settings.MEDIA_ROOT, unique_filename)

            document_type = file_extension.lstrip('.').lower()

            if use == 'sop' or use == 'resume' or use == 'test_score_document': 
                document_type = 'pdf'
            elif use == 'image':
                document_type = 'image'
            else:
                document_type = 'image'
            
            """
            print({
                'type': document_type,
                'image': data,
                'user': user.id,
                'file_name': data.name,
                'file_name_system': unique_filename
            })
            """
            document_serializer = DocumentSerializer(data={
                'type': document_type,
                'image': data,
                'user': user.id,
                'file_name': data.name,
                'file_name_system': unique_filename
            })
            
            if document_serializer.is_valid():
                document_serializer.save()
                document = document_serializer.instance

                with open(file_path, 'wb') as file:
                    for chunk in data.chunks():
                        file.write(chunk)

                user_document_serializer = UserDocumentSerializer(data={
                    'document': document.id,
                    'use': use,
                    'user': user.id
                })
                if user_document_serializer.is_valid():
                    user_document = user_document_serializer.save()
                    response_data = document_serializer.data
                    response_data['user_document_id'] = user_document.id
                    if return_file_path:
                        return True, response_data, file_path
                    return True, response_data
                else:
                    document.delete()  
                    os.remove(file_path)
                    if return_file_path:
                        return True, response_data, "invalid_path",
                    return False, user_document_serializer.errors
            else:
                if return_file_path:
                    return True, response_data, "invalid_path",
                return False, document_serializer.errors

    except Exception as e:
        if return_file_path:
            return False, str(e), "invalid_path",
        return False, str(e)


def delete_previous_documents(user, document_type, exclude_document_ids):
    try:
        user_documents = UserDocument.objects.filter(
            user=user, use=document_type).exclude(document_id__in=exclude_document_ids)

        for user_document in user_documents:
            document = user_document.document
            user_document.delete()
            document.delete()

    except Exception as e:
        # Handle exceptions as needed, e.g., logging or notifying the user
        print(f"An error occurred: {str(e)}")


def delete_previous_files_from_server(user, document_type, exclude_document_ids):
    try:
        user_documents = UserDocument.objects.filter(
            user=user, use=document_type).exclude(document_id__in=exclude_document_ids)

        for user_document in user_documents:
            document = user_document.document
            file_path = os.path.join(
                settings.MEDIA_ROOT, document.file_name_system)

            if os.path.exists(file_path):
                os.remove(file_path)

    except Exception as e:
        # Handle exceptions as needed, e.g., logging or notifying the user
        print(f"An error occurred: {str(e)}")
        
        
def get_response_template():
    return {
        'status': '',
        'message': '',
        'error_code': '',
        'details': None,
        'data': None,
    }
    
    
def edit_file(pk, data, use, user, allowed_types=None, max_size_mb=int(os.getenv('MAX_FILE_UPLOAD_SIZE_DEFAULT'))):
    try:
        with transaction.atomic():
            if allowed_types is None:
                # Default to PDF if allowed_types is not provided
                allowed_types = ['.pdf', '.jpg', '.jpeg', '.png']
                allowed_types_pdf = ['.pdf']
                allowed_types_image = ['.jpg', '.jpeg', '.png']

            # Validate file type
            file_extension = os.path.splitext(data.name)[1].lower()
            if file_extension not in allowed_types:
                if use == 'sop' or use == 'resume':
                    return False, GLOBAL_ERROR_MESSAGES['invalid_extension'].format(extensions=", ".join(allowed_types_pdf))
                elif use == 'image':
                    return False, GLOBAL_ERROR_MESSAGES['invalid_extension'].format(extensions=", ".join(allowed_types_image))
                
            # Validate file size
            max_size_bytes = max_size_mb * 1024 * 1024  # Convert MB to bytes
            system_max_size_bytes = int(os.getenv('MAX_FILE_UPLOAD_SIZE_DEFAULT')) * 1024 * 1024

            if data.size > system_max_size_bytes:
                return False, GLOBAL_ERROR_MESSAGES['exceeds_max_size']

            if data.size > max_size_bytes:
                return False, GLOBAL_ERROR_MESSAGES['exceeds_max_size']

            # Get existing document
            try:
                document = Document.objects.get(pk=pk, user=user)
            except Document.DoesNotExist:
                return False, 'Document not found'

            # Delete existing file from the file system
            existing_file_path = os.path.join(settings.MEDIA_ROOT, document.file_name_system)
            if os.path.exists(existing_file_path):
                os.remove(existing_file_path)

            # Generate a unique file name
            unique_filename = f"{uuid.uuid4()}{file_extension}"

            # Define the full path to save the file
            file_path = os.path.join(settings.MEDIA_ROOT, unique_filename)

            document_type = file_extension.lstrip('.').lower()

            if use == 'sop' or use == 'resume':
                document_type = 'pdf'
            elif use == 'image':
                document_type = 'image'

            # Update Document instance
            document_serializer = DocumentSerializer(document, data={
                'type': document_type,
                'image': data,
                'user': user.id,
                'file_name': data.name,
                'file_name_system': unique_filename
            }, partial=True)

            if document_serializer.is_valid():
                document_serializer.save()

                with open(file_path, 'wb') as file:
                    for chunk in data.chunks():
                        file.write(chunk)

                return True, document_serializer.data
            else:
                return False, document_serializer.errors

    except Exception as e:
        return False, str(e)


def get_user_info(request):
    if request.user.is_authenticated:
        return f"by user {request.user.username} (user ID: {request.user.id})"
    else:
        return "by an anonymous user"

def log_request(method, view_name, request, pk=None):
    """
    Utility function to log request information.
    
    :param method: HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
    :param view_name: Name of the view handling the request
    :param request: Django request object
    :param pk: Optional primary key associated with the request
    """
    user_info = get_user_info(request)
    pk_info = f" for pk={pk}" if pk is not None else ""
    logger.info(f"{method} request received in {view_name} {user_info}{pk_info} at {timezone.now()}")
    
    
def log_request_error(method, error_text, request, pk=None):
    user_info = get_user_info(request)
    pk_info = f" for pk={pk}" if pk is not None else ""
    logger.error(f"Error occurred during {method} request by {user_info} at {timezone.now()}: {error_text}")




def get_serializer_class(target_app):
    if 'educational_organizations' in  target_app: return EducationalOrganizationsSerializer
    elif 'campus' in  target_app:  return CampusSerializer
    elif 'college' in  target_app: return CollegeSerializer
    elif 'department' in  target_app: return DepartmentSerializer
    elif 'faculty' in  target_app: return FacultyMembersSerializer
    elif 'user' in  target_app: return UserSerializer
    else: raise ValidationError({"error": _("Unsupported entity type")})

def get_model_class (target_app):
    if 'educational_organizations' in  target_app: return EducationalOrganizations
    elif 'campus' in  target_app: return Campus
    elif 'college' in  target_app: return College
    elif 'department' in  target_app: return Department
    elif 'faculty' in  target_app: return FacultyMembers
    elif 'user' in  target_app: return User
    else: raise ValidationError({"error": _("Unsupported entity type")})


def parse_excel(file):
    workbook = openpyxl.load_workbook(file)
    sheet = workbook.active
    data = []
    headers = [cell.value for cell in sheet[1]]
    for row in sheet.iter_rows(min_row=2, values_only=True):
        data.append(dict(zip(headers, row)))
    return data

def parse_csv(file):
    data = []
    reader = csv.DictReader(file.read().decode('utf-8').splitlines())
    for row in reader:
        data.append(row)
    return data

def extract_data_file(file):
    if not file:
        return Response({"message": _("No file uploaded.")}, status=status.HTTP_400_BAD_REQUEST)

    file_type = file.name.split('.')[-1]

    if file_type == 'xlsx':
        data = parse_excel(file)
    elif file_type == 'csv':
        data = parse_csv(file)
    else:
        return Response({"error": _("Unsupported file type")}, status=status.HTTP_400_BAD_REQUEST)
    
    return data

# take a list of file path and delete the file of the path
def delete_uploaded_files( file_paths):
    fs = FileSystemStorage()
    for file_path in file_paths:
        if fs.exists(file_path):
            fs.delete(file_path)
            
            
def has_organization_college_permission(user, permission_codename, organization=None, college=None):
    # Get the permission object
    try:
        permission = Permission.objects.get(codename=permission_codename)
    except Permission.DoesNotExist:
        return False

    # Filter groups associated with the given organization and/or college
    if organization and college:
        groups = user.groups.filter(
            organizationcollegegroup__organization=organization,
            organizationcollegegroup__college=college,
            organizationcollegegroup__permissions=permission
        )
    elif organization:
        
        groups = user.groups.filter(
            organizationcollegegroup__organization=organization,
            organizationcollegegroup__permissions=permission
        )
    elif college:
        groups = user.groups.filter(
            organizationcollegegroup__college=college,
            organizationcollegegroup__permissions=permission
        )
    else:
        groups = user.groups.filter(
            organizationcollegegroup__permissions=permission
        )

    return groups.exists()




from common.base_models import CustomGroup
def has_organization_college_permission(user, permission_codename, organization=None, college=None):
    if not user.is_authenticated:
        return False
    
    if not organization and not college:
        return false
    
    if not permission_codename:
        return false

    if organization:
        try:
            custom_group = CustomGroup.objects.get(organization_id=organization)
        except Exception as e:
            return false
    
    if college:
        try:
            custom_group = CustomGroup.objects.get(college_id=college)
        except Exception as e:
            return false
    try:
        permission = Permission.objects.get(codename=permission_codename)
        permission_id = permission.id
    except:
        return False
    
    has_permission = custom_group.permissions.filter(id=permission_id).exists()
    
    return has_permission


def get_user_info_data(user):
    
    user_data = {
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }

    # Standard Django groups (roles)
    groups = user.groups.values_list('name', flat=True)
    user_data["roles"] = list(groups)

    # Fetch the user's UserDetails (if it exists)
    try:
        user_details = UserDetails.objects.get(user=user)
        organization = user_details.organization
        user_data["organization"] = {
            "name": organization.name if organization else None,
            "id": organization.id if organization else None
        }

        # Include UserDetails fields in the response
        user_data["date_of_birth"] = user_details.date_of_birth
        # Add other fields from UserDetails as needed
    except UserDetails.DoesNotExist:
        user_data["organization"] = None  # No organization if UserDetails doesn't exist

    # Custom groups associated with the user
    custom_groups = CustomGroup.objects.filter(
        Q(organization=user_details.organization) |  # Filter by organization
        Q(college=user_details.college)  # Filter by college
    ).values_list('name', 'organization__name', 'college__name')

    # Prepare the custom group roles for the user
    custom_group_roles = [
        {"group_name": name, "organization": org, "college": college}
        for name, org, college in custom_groups
    ]
    #user_data["custom_group_roles"] = custom_group_roles
    user_data["custom_group_roles"] = ''

    return user_data
    
    
def has_custom_perm(user, perm_codename):
    if user.has_perm(perm_codename):
        return True
    try:
        
        custom_groups = user.userdetails.custom_groups.all()  # Adjust this according to your user model

        custom_group_permissions = Permission.objects.filter(customgroup__in=custom_groups).distinct()
        
        if custom_group_permissions.filter(codename=perm_codename.split('.')[1]).exists():
            return True

    except UserDetails.DoesNotExist:
        return False

    return False
