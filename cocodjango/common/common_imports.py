import logging
import datetime
from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.translation import gettext_lazy
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from global_messages import SUCCESS_MESSAGES as GLOBAL_SUCCESS_MESSAGES
from error_codes import ErrorCodes
from utils import get_response_template
from django.http import JsonResponse
from django.db.models import Q
import os
import uuid
from django.conf import settings
from utils import log_request, log_request_error
from django.core.exceptions import FieldError
from rest_framework.parsers import JSONParser
from django.shortcuts import get_object_or_404