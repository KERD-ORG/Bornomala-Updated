from django.http import JsonResponse
from rest_framework.parsers import JSONParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from .models import University
from .serializers import UniversitySerializer
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.core.exceptions import FieldError

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def university_list(request):
    if request.method == 'GET':
        # Check for view permission
        if not request.user.has_perm('university_app.view_university'):
            return JsonResponse({'message': 'You do not have permission to view universities'}, status=403)
        
        # Get query parameters
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 50))
        sort_columns_param = request.GET.get('sortColumns', '')
        sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else []
        search_term = request.GET.get('searchTerm', '')

        # Filter universities queryset
        universities = University.objects.filter(deleted_at__isnull=True)

        # Apply search filter
        if search_term:
            universities = universities.filter(
                name__icontains=search_term
            )

        # Apply sorting if sort_columns is not empty and contains valid fields
        if sort_columns:
            try:
                universities = universities.order_by(*sort_columns)
            except FieldError as e:
                return JsonResponse({'error': str(e)}, status=400)

        # Paginate using offset and limit
        universities_page = universities[offset:offset + limit]

        # Serialize data
        serializer = UniversitySerializer(universities_page, many=True)
        return JsonResponse(serializer.data, safe=False)

    # Handle other HTTP methods
    return JsonResponse({'message': 'Method not allowed'}, status=405)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def university_create(request):
    if request.method == 'POST':
        # Check for add permission
        if not request.user.has_perm('university_app.add_university'):
            return Response({'message': 'You do not have permission to add a university'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UniversitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def university_createssss(request):
    if request.method == 'POST':
        # Check for add permission
        if not request.user.has_perm('university_app.add_university'):
            return JsonResponse({'message': 'You do not have permission to add a university'}, status=status.HTTP_403_FORBIDDEN)
        
        data = JSONParser().parse(request)
        serializer = UniversitySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def university_detail(request, pk):
    try:
        university = University.objects.get(pk=pk, deleted_at__isnull=True)
    except University.DoesNotExist:
        return JsonResponse({'message': 'The university does not exist'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Check for view permission
        if not request.user.has_perm('university_app.view_university'):
            return JsonResponse({'message': 'You do not have permission to view this university'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UniversitySerializer(university)
        return JsonResponse(serializer.data)

    elif request.method == 'PUT':
        
        # Check for change permission
        if not request.user.has_perm('university_app.change_university'):
            return JsonResponse({'message': 'You do not have permission to change this university'}, status=status.HTTP_403_FORBIDDEN)
        
        #data = JSONParser().parse(request)
        serializer = UniversitySerializer(university, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.has_perm('university_app.delete_university'):
            return Response({'message': 'You do not have permission to delete this university'}, status=status.HTTP_403_FORBIDDEN)
        
        university.soft_delete()
        return Response({'message': 'University was deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

