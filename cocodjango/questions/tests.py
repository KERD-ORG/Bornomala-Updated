import uuid
from django.http import JsonResponse
from django.views import View

class LocalPresignURLView(View):
    """
    Simulate generating a pre-signed URL for local file upload.
    """

    def get(self, request, *args, **kwargs):
        file_name = request.GET.get('file_name')
        file_type = request.GET.get('file_type')

        if not file_name or not file_type:
            return JsonResponse({'error': 'file_name and file_type are required.'}, status=400)

        # Generate a unique file name
        unique_file_name = f"{uuid.uuid4()}_{file_name}"

        # Simulated pre-signed URL (upload endpoint)
        presigned_url = f"/fake-upload/?file_name={unique_file_name}"

        # Simulated access URL after upload
        video_url = f"/media/explanations/videos/{unique_file_name}"

        return JsonResponse({
            'presigned_url': presigned_url,
            'video_url': video_url
        })


import os
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage

# Ensure the upload directory exists
VIDEO_UPLOAD_PATH = 'media/explanations/videos/'
os.makedirs(os.path.join(settings.BASE_DIR, VIDEO_UPLOAD_PATH), exist_ok=True)

@csrf_exempt
def fake_upload(request):
    """
    Simulate uploading a video to local storage using the pre-signed URL.
    """
    if request.method == 'POST' and request.FILES.get('file'):
        file_name = request.GET.get('file_name')
        video_file = request.FILES['file']

        if not file_name:
            return JsonResponse({'error': 'file_name is required in the query params.'}, status=400)

        # Save the video locally
        fs = FileSystemStorage(location=VIDEO_UPLOAD_PATH)
        filename = fs.save(file_name, video_file)
        video_url = f"/{VIDEO_UPLOAD_PATH}{filename}"

        return JsonResponse({
            'message': 'File uploaded successfully!',
            'video_url': video_url
        })

    return JsonResponse({'error': 'No file provided or invalid request.'}, status=400)
