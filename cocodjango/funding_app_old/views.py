from django.db.models import Q
from django.core.exceptions import FieldError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import permission_classes
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from .models import Funding, Benefit
from .serializers import FundingSerializer, BenefitSerializer
from common.models import UserDocument
from global_messages import ERROR_MESSAGES as GLOBAL_ERROR_MESSAGES
from utils import get_response_template, upload_file


class FundingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        response_data = get_response_template()
        if pk:
            funding = get_object_or_404(Funding, pk=pk, deleted_at__isnull=True)
            serializer = FundingSerializer(funding)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Funding record retrieved successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 50))
            sort_columns_param = request.GET.get('sortColumns', '')
            sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else ['-created_at']
            search_term = request.GET.get('searchTerm', '')

            funding_data = Funding.objects.filter(deleted_at__isnull=True)

            if search_term:
                q_objects = Q(
                    originator__icontains=search_term
                ) | Q(
                    originator_edu_org__name__icontains=search_term
                ) | Q(
                    originator_faculty_member__user__username__icontains=search_term
                ) | Q(
                    originator_other_name__icontains=search_term
                ) | Q(
                    funding_type__icontains=search_term
                ) | Q(
                    funding_type_name__icontains=search_term
                ) | Q(
                    amount_type__icontains=search_term
                ) | Q(
                    amount_type_name__icontains=search_term
                ) | Q(
                    amount__icontains=search_term
                ) | Q(
                    benefits__name__icontains=search_term
                ) | Q(
                    funding_for__icontains=search_term
                ) | Q(
                    funding_for_faculty__user__username__icontains=search_term
                ) | Q(
                    funding_for_department__name__icontains=search_term
                ) | Q(
                    funding_for_other_name__icontains=search_term
                ) | Q(
                    funding_open_date__icontains=search_term
                ) | Q(
                    funding_end_date__icontains=search_term
                )
                funding_data = funding_data.filter(q_objects)

            try:
                funding_data = funding_data.order_by(*sort_columns)
            except FieldError as e:
                response_data.update({
                    'status': 'error',
                    'message': str(e),
                    'error_code': 'BAD_REQUEST',
                })
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

            funding_data_page = funding_data[offset:offset + limit]

            if funding_data_page:
                serializer = FundingSerializer(funding_data_page,context={'request': request}, many=True)
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': _('Funding records retrieved successfully.')
                })
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['no_records_found'],
                    'error_code': 'RESOURCE_NOT_FOUND',
                })
                return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request):
        response_data = get_response_template()
        serializer = FundingSerializer(data=request.data,context={'request': request})
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Funding record created successfully.')
            })
            return Response(response_data, status=status.HTTP_201_CREATED)
        response_data.update({
            'status': 'error',
            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
            'error_code': 'VALIDATION_ERROR',
            'details': serializer.errors
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, pk):
        response_data = get_response_template()
        funding = get_object_or_404(Funding, pk=pk)
        serializer = FundingSerializer(funding, data=request.data,context={'request': request}, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Funding record updated successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)
        response_data.update({
            'status': 'error',
            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
            'error_code': 'VALIDATION_ERROR',
            'details': serializer.errors
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk):
        response_data = get_response_template()
        funding = get_object_or_404(Funding, pk=pk)
        funding.deleted_at = timezone.now()
        funding.save()
        response_data.update({
            'status': 'success',
            'message': _('Funding record deleted successfully.')
        })
        return Response(response_data, status=status.HTTP_204_NO_CONTENT)


class BenefitView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        response_data = get_response_template()
        if pk:
            benefit = get_object_or_404(Benefit, pk=pk, deleted_at__isnull=True)
            serializer = BenefitSerializer(benefit)
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Benefit record retrieved successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 50))
            sort_columns_param = request.GET.get('sortColumns', '')
            sort_columns = sort_columns_param.strip('[]').split(',') if sort_columns_param else ['-created_at']
            search_term = request.GET.get('searchTerm', '')

            benefit_data = Benefit.objects.filter(deleted_at__isnull=True)

            if search_term:
                q_objects = Q(
                    name__icontains=search_term
                ) | Q(
                    details__icontains=search_term
                )
                benefit_data = benefit_data.filter(q_objects)

            try:
                benefit_data = benefit_data.order_by(*sort_columns)
            except FieldError as e:
                response_data.update({
                    'status': 'error',
                    'message': str(e),
                    'error_code': 'BAD_REQUEST',
                })
                return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

            benefit_data_page = benefit_data[offset:offset + limit]

            if benefit_data_page:
                serializer = BenefitSerializer(benefit_data_page, many=True)
                response_data.update({
                    'status': 'success',
                    'data': serializer.data,
                    'message': _('Benefit records retrieved successfully.')
                })
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                response_data.update({
                    'status': 'error',
                    'message': GLOBAL_ERROR_MESSAGES['no_records_found'],
                    'error_code': 'RESOURCE_NOT_FOUND',
                })
                return Response(response_data, status=status.HTTP_404_NOT_FOUND)

    @transaction.atomic
    def post(self, request):
        response_data = get_response_template()
        serializer = BenefitSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Benefit record created successfully.')
            })
            return Response(response_data, status=status.HTTP_201_CREATED)
        response_data.update({
            'status': 'error',
            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
            'error_code': 'VALIDATION_ERROR',
            'details': serializer.errors
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, pk):
        response_data = get_response_template()
        benefit = get_object_or_404(Benefit, pk=pk)
        serializer = BenefitSerializer(benefit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_data.update({
                'status': 'success',
                'data': serializer.data,
                'message': _('Benefit record updated successfully.')
            })
            return Response(response_data, status=status.HTTP_200_OK)
        response_data.update({
            'status': 'error',
            'message': GLOBAL_ERROR_MESSAGES['fix_following_error'],
            'error_code': 'VALIDATION_ERROR',
            'details': serializer.errors
        })
        return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk):
        response_data = get_response_template()
        benefit = get_object_or_404(Benefit, pk=pk)
        benefit.deleted_at = timezone.now()
        benefit.save()
        response_data.update({
            'status': 'success',
            'message': _('Benefit record deleted successfully.')
        })
        return Response(response_data, status=status.HTTP_204_NO_CONTENT)
