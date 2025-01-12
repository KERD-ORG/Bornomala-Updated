# views.py
from rest_framework import generics
import os
from django.conf import settings
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt

from .models import (
    Organization, QuestionLevel, TargetGroup, Subject,
    QuestionType, Topic, SubTopic, SubSubTopic,
    DifficultyLevel, QuestionStatus, ExamReference,
    Question
)
from .serializers import (
    OrganizationSerializer, QuestionLevelSerializer, TargetGroupSerializer,
    SubjectSerializer, QuestionTypeSerializer, TopicSerializer,
    SubTopicSerializer, SubSubTopicSerializer, DifficultyLevelSerializer,
    QuestionStatusSerializer, ExamReferenceSerializer, QuestionSerializer
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
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class QuestionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

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


from django.urls import reverse
from django.http import (
    HttpResponse,
    HttpResponseNotFound,
)
import uuid
import time

@csrf_exempt
def upload(request):
    """
    Handle PUT to store the file locally in MEDIA_ROOT.
    Example usage:
        PUT /upload?filename=myvideo.mp4
        (Use raw binary data in the request body)
    """
    if request.method == 'PUT':
        file_name = request.GET.get('filename', 'default.mp4')
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

            # Build a URL for retrieving the uploaded video
            video_url = request.build_absolute_uri(
                reverse('get_video', args=[unique_name])
            )

            return JsonResponse({
                'message': 'File uploaded successfully.',
                'video_link': video_url
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
def get_video(request, filename):
    """
    When a user accesses /media/<filename>, serve the video file if it exists.
    """
    full_path = os.path.join(settings.MEDIA_ROOT, filename)

    if not os.path.exists(full_path):
        return HttpResponseNotFound('File not found.')

    # Read the file from disk
    with open(full_path, 'rb') as f:
        file_data = f.read()

    # Use a generic video MIME type or detect based on extension
    return HttpResponse(file_data, content_type='video/mp4')