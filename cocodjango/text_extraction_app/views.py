import os
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.utils.translation import gettext_lazy as _
# from profile_app.models import TestScore
# from profile_app.serializers import TestScoreSerializer
from profile_app.models import UserDocument
from .utils.text_data_extractionv2 import DataExtractor
from common.common_imports import * 

import environ
 
env = environ.Env()
environ.Env.read_env()  # Load the .env file

JSON_SCHEMA_PATH = env('JSON_SCHEMA_PATH')

class ResumeProcessView(APIView):
    permission_classes = [IsAuthenticated]
  
    @swagger_auto_schema(
        operation_summary=_("Process Resume"),
        operation_description=_("Allows authenticated users to process their stored resume, extract text, and map extracted data to database tables."),
        responses={
            200: openapi.Response(description=_("Success")),
            400: openapi.Response(description=_("Bad Request")),
            404: openapi.Response(description=_("Not Found")),
            500: openapi.Response(description=_("Internal Server Error"))
        }
    )
    @transaction.atomic
    def post(self, request, format=None):
        user = request.user

        # Get the latest uploaded resume document
        user_document = UserDocument.objects.filter(user=user, use=UserDocument.RESUME).latest('created_at')
        if not user_document:
            return Response({
                'status': 'error',
                'message': _("No resume found for the user.")
            }, status=status.HTTP_404_NOT_FOUND)

        resume_file_path = default_storage.path(user_document.document.file_name_system)

        # Extract text and map to database
        print("resume_file_path: ")
        print(resume_file_path)
        data_extractor = DataExtractor()
        json_file_path = JSON_SCHEMA_PATH # Specify the path to your JSON schema file
        extracted_data = data_extractor.extract_applicant_data(resume_file_path, json_file_path)

        # Map extracted data to the database
        # self.map_extracted_data_to_db(extracted_data, user)

        return Response({
            'status': 'success',
            'message': _("Resume processed successfully."),
            'extracted_data': extracted_data
        }, status=status.HTTP_200_OK)

    # def map_extracted_data_to_db(self, extracted_data, user):
    #     for item in extracted_data.get('extracted_data', []):
    #         if 'profile_app_testscore' in item:
    #             for test_score_data in item['profile_app_testscore']:
    #                 test_score_serializer = TestScoreSerializer(data=test_score_data)
    #                 if test_score_serializer.is_valid():
    #                     test_score_serializer.save(user=user)
    #                 else:
    #                     print("Test Score Data Error:", test_score_serializer.errors)
            # Add similar blocks for other data types like educational background, work experience, etc.





  