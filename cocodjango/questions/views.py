# views.py
import os
import time
import uuid

from django.conf import settings
from django.http import (
    HttpResponse,
    HttpResponseNotFound,
)
from django.http import JsonResponse, HttpResponseNotAllowed
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from educational_organizations_app.models import EducationalOrganizations as Organization
from rest_framework import generics,status
from rest_framework.response import Response

from .models import (
    QuestionLevel, TargetGroup, Subject,
    QuestionType, Topic, SubTopic, SubSubTopic,
    DifficultyLevel, QuestionStatus, ExamReference,
    MCQSingleQuestion, MCQMultiQuestion, FillInTheBlanksQuestion, TrueFalseQuestion,
    MatchingQuestion, OrderingQuestion, NumericalQuestion, ImageBasedQuestion,
    AudioVideoQuestion, CaseStudyQuestion, DiagramLabelingQuestion,
    CodeProgrammingQuestion, DragAndDropQuestion, AssertionReasonQuestion

)
from .serializers import (
    OrganizationSerializer, QuestionLevelSerializer, TargetGroupSerializer,
    SubjectSerializer, QuestionTypeSerializer, TopicSerializer,
    SubTopicSerializer, SubSubTopicSerializer, DifficultyLevelSerializer,
    QuestionStatusSerializer, ExamReferenceSerializer, QuestionSerializerFactory
)


# -------------------------
# ORGANIZATION
# -------------------------
class OrganizationListCreateView(generics.ListCreateAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer


class OrganizationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer


# -------------------------
# QUESTION LEVEL
# -------------------------
class QuestionLevelListCreateView(generics.ListCreateAPIView):
    queryset = QuestionLevel.objects.all()
    serializer_class = QuestionLevelSerializer


class QuestionLevelRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuestionLevel.objects.all()
    serializer_class = QuestionLevelSerializer


# -------------------------
# TARGET GROUP
# -------------------------
class TargetGroupListCreateView(generics.ListCreateAPIView):
    queryset = TargetGroup.objects.all()
    serializer_class = TargetGroupSerializer


class TargetGroupRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TargetGroup.objects.all()
    serializer_class = TargetGroupSerializer


# -------------------------
# SUBJECT
# -------------------------
class SubjectListCreateView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class SubjectRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


# -------------------------
# QUESTION TYPE
# -------------------------
class QuestionTypeListCreateView(generics.ListCreateAPIView):
    queryset = QuestionType.objects.all()
    serializer_class = QuestionTypeSerializer


class QuestionTypeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuestionType.objects.all()
    serializer_class = QuestionTypeSerializer


# -------------------------
# TOPIC
# -------------------------
class TopicListCreateView(generics.ListCreateAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer


class TopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer


# -------------------------
# SUBTOPIC
# -------------------------
class SubTopicListCreateView(generics.ListCreateAPIView):
    queryset = SubTopic.objects.all()
    serializer_class = SubTopicSerializer


class SubTopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubTopic.objects.all()
    serializer_class = SubTopicSerializer


# -------------------------
# SUBSUBTOPIC
# -------------------------
class SubSubTopicListCreateView(generics.ListCreateAPIView):
    queryset = SubSubTopic.objects.all()
    serializer_class = SubSubTopicSerializer


class SubSubTopicRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubSubTopic.objects.all()
    serializer_class = SubSubTopicSerializer


# -------------------------
# DIFFICULTY LEVEL
# -------------------------
class DifficultyLevelListCreateView(generics.ListCreateAPIView):
    queryset = DifficultyLevel.objects.all()
    serializer_class = DifficultyLevelSerializer


class DifficultyLevelRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DifficultyLevel.objects.all()
    serializer_class = DifficultyLevelSerializer


# -------------------------
# QUESTION STATUS
# -------------------------
class QuestionStatusListCreateView(generics.ListCreateAPIView):
    queryset = QuestionStatus.objects.all()
    serializer_class = QuestionStatusSerializer


class QuestionStatusRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuestionStatus.objects.all()
    serializer_class = QuestionStatusSerializer


# -------------------------
# EXAM REFERENCE
# -------------------------
class ExamReferenceListCreateView(generics.ListCreateAPIView):
    queryset = ExamReference.objects.all()
    serializer_class = ExamReferenceSerializer


class ExamReferenceRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExamReference.objects.all()
    serializer_class = ExamReferenceSerializer


# -------------------------
# QUESTION
# -------------------------
class QuestionListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        question_type = self.request.query_params.get('type')
        model_mapping = {
            'MCQ_SINGLE': MCQSingleQuestion,
            'MCQ_MULTI': MCQMultiQuestion,
            'FILL_BLANK': FillInTheBlanksQuestion,
            'TRUE_FALSE': TrueFalseQuestion,
            'MATCHING': MatchingQuestion,
            'ORDERING': OrderingQuestion,
            'NUMERICAL': NumericalQuestion,
            'IMAGE': ImageBasedQuestion,
            'AUDIO_VIDEO': AudioVideoQuestion,
            'CASE_STUDY': CaseStudyQuestion,
            'DIAGRAM': DiagramLabelingQuestion,
            'CODE': CodeProgrammingQuestion,
            'DRAG_DROP': DragAndDropQuestion,
            'ASSERTION_REASON': AssertionReasonQuestion
        }
        if question_type:
            model = model_mapping.get(question_type)
            if model:
                return model.objects.all()
            return MCQSingleQuestion.objects.none()

            # If no type is specified, combine querysets from all models
        all_questions = []
        for model in model_mapping.values():
            all_questions.extend(model.objects.all())
        return all_questions

    def get_serializer_class(self):
        question_type = self.request.query_params.get('type')
        if not question_type:
            return QuestionSerializerFactory.get_generic_serializer()
        return QuestionSerializerFactory.get_serializer(question_type)

    def create(self, request, *args, **kwargs):
        question_type_param = self.request.query_params.get('type')
        if not question_type_param:
            return Response({"error": "The 'type' query parameter is required."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Inject `question_type` into the request data
        request.data['question_type'] = question_type_param

        # Get the correct serializer
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(data=request.data)

        # Validate and save
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class QuestionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    View to handle retrieving, updating, and deleting questions dynamically based on question type.
    """

    def get_queryset(self):
        question_type = self.request.query_params.get('type')
        model_mapping = {
            'MCQ_SINGLE': MCQSingleQuestion,
            'MCQ_MULTI': MCQMultiQuestion,
            'FILL_BLANK': FillInTheBlanksQuestion,
            'TRUE_FALSE': TrueFalseQuestion,
            'MATCHING': MatchingQuestion,
            'ORDERING': OrderingQuestion,
            'NUMERICAL': NumericalQuestion,
            'IMAGE': ImageBasedQuestion,
            'AUDIO_VIDEO': AudioVideoQuestion,
            'CASE_STUDY': CaseStudyQuestion,
            'DIAGRAM': DiagramLabelingQuestion,
            'CODE': CodeProgrammingQuestion,
            'DRAG_DROP': DragAndDropQuestion,
            'ASSERTION_REASON': AssertionReasonQuestion
        }
        model = model_mapping.get(question_type, MCQSingleQuestion)
        return model.objects.all()

    def get_serializer_class(self):
        question_type = self.request.query_params.get('type')
        return QuestionSerializerFactory.get_serializer(question_type)

    def update(self, request, *args, **kwargs):
        """
        Update a question instance.
        """
        question_type_param = self.request.query_params.get('type')
        partial = kwargs.pop('partial', False)  # Allow partial updates (PATCH)
        instance = self.get_object()
        request.data['question_type'] = question_type_param
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a question instance.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"message": "Question deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


@csrf_exempt
def presign_url(request):
    """
    Mimic presigned URLs by returning a fake upload URL and an object URL.
    E.g. GET /presign-url?file_name=myvideo.mp4
    """
    if request.method == 'GET':
        file_name = request.GET.get('file_name', 'default.mp4')
        # Build an upload URL that includes the filename as a query param
        # so we know where to store it.
        upload_url = request.build_absolute_uri(f'/api/fake-upload?filename={file_name}')
        # The final "object_url" is how the file can be publicly accessed later
        # (this relies on serving MEDIA files, see urls.py below).
        object_url = request.build_absolute_uri(f'{settings.MEDIA_URL}{file_name}')

        return JsonResponse({
            'url': upload_url,
            'object_url': object_url
        })
    return HttpResponseNotAllowed(['GET'])


@csrf_exempt
def fake_upload(request):
    """
    Handle PUT to store the file locally in MEDIA_ROOT.
    E.g. PUT /fake-upload?filename=myvideo.mp4
    """
    if request.method == 'PUT':
        file_name = request.GET.get('filename', 'default.mp4')
        full_path = os.path.join(settings.MEDIA_ROOT, file_name)

        # Write the raw request body directly to a file
        with open(full_path, 'wb') as f:
            f.write(request.body)

        return JsonResponse({'message': 'File uploaded successfully.'})
    return HttpResponseNotAllowed(['PUT'])


@csrf_exempt
def upload(request):
    """
    Handle PUT to store the file locally in MEDIA_ROOT.
    Example usage:
        PUT /upload?filename=myfile.ext
        (Use raw binary data in the request body)
    """
    if request.method == 'PUT':
        file_name = request.GET.get('filename', 'default.bin')
        unique_name = f"{int(time.time())}_{uuid.uuid4()}_{file_name}"
        full_path = os.path.join(settings.MEDIA_ROOT, unique_name)

        try:
            if not request.body:
                return JsonResponse(
                    {'message': 'No file data found in the request body.'},
                    status=400
                )

            # Write the raw request body directly to a file
            with open(full_path, 'wb') as f:
                f.write(request.body)

            # Build a URL for retrieving the uploaded file using the new endpoint
            file_url = request.build_absolute_uri(
                reverse('get_media', args=[unique_name])
            )

            return JsonResponse({
                'message': 'File uploaded successfully.',
                'media_link': file_url
            }, status=201)

        except Exception as e:
            return JsonResponse(
                {
                    'message': 'Failed to upload file.',
                    'error': str(e)
                },
                status=500
            )
    else:
        return HttpResponseNotAllowed(['PUT'])


@csrf_exempt
def get_media(request, filename):
    """
    Serve any media file from MEDIA_ROOT if it exists.
    """
    full_path = os.path.join(settings.MEDIA_ROOT, filename)

    if not os.path.exists(full_path):
        return HttpResponseNotFound('File not found.')

    # Determine the MIME type based on the file extension
    mime_type, _ = mimetypes.guess_type(full_path)
    # Fallback to a generic binary stream if type is unknown
    content_type = mime_type if mime_type else 'application/octet-stream'

    # Read the file from disk
    try:
        with open(full_path, 'rb') as f:
            file_data = f.read()
        return HttpResponse(file_data, content_type=content_type)
    except Exception as e:
        return HttpResponse(f'Error reading file: {str(e)}', status=500)
