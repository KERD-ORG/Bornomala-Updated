from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EducationalOrganizationsCategory, EducationalOrganizations, Division
from .serializers import (
    EducationalOrganizationsCategorySerializer,
    EducationalOrganizationsSerializer, DivisionSerializer
)


class EducationalOrganizationsCategoryView(APIView):
    """
    CRUD for EducationalOrganizationsCategory
    """

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return EducationalOrganizationsCategory.objects.get(pk=pk, deleted_at__isnull=True)
        except EducationalOrganizationsCategory.DoesNotExist:
            return None

    def get(self, request, pk=None):
        """
        - GET /categories/ : list categories
        - GET /categories/<pk>/ : detail of a single category
        """
        if pk:
            category = self.get_object(pk)
            if not category:
                return Response(
                    {'message': _('Educational organization category not found.')},
                    status=status.HTTP_404_NOT_FOUND
                )
            # Example permission check
            if not request.user.has_perm('educational_organizations_app.view_educationalorganizationscategory'):
                return Response(
                    {'message': _('You do not have permission to view this category.')},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = EducationalOrganizationsCategorySerializer(category)
            return Response(serializer.data)
        else:
            # List
            if not request.user.has_perm('educational_organizations_app.view_educationalorganizationscategory'):
                return Response(
                    {'message': _('You do not have permission to view categories.')},
                    status=status.HTTP_403_FORBIDDEN
                )
            categories = EducationalOrganizationsCategory.objects.filter(deleted_at__isnull=True)
            serializer = EducationalOrganizationsCategorySerializer(categories, many=True)
            return Response(serializer.data)

    @transaction.atomic
    def post(self, request):
        """Create a new category."""
        if not request.user.has_perm('educational_organizations_app.add_educationalorganizationscategory'):
            return Response(
                {'message': _('You do not have permission to create a category.')},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = EducationalOrganizationsCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, pk):
        """Update an existing category."""
        category = self.get_object(pk)
        if not category:
            return Response(
                {'message': _('Educational organization category not found.')},
                status=status.HTTP_404_NOT_FOUND
            )
        if not request.user.has_perm('educational_organizations_app.change_educationalorganizationscategory'):
            return Response(
                {'message': _('You do not have permission to update this category.')},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = EducationalOrganizationsCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk):
        """Soft-delete an existing category."""
        category = self.get_object(pk)
        if not category:
            return Response(
                {'message': _('Educational organization category not found.')},
                status=status.HTTP_404_NOT_FOUND
            )
        if not request.user.has_perm('educational_organizations_app.delete_educationalorganizationscategory'):
            return Response(
                {'message': _('You do not have permission to delete this category.')},
                status=status.HTTP_403_FORBIDDEN
            )
        category.deleted_at = timezone.now()
        category.save()
        return Response(
            {'message': _('Category deleted successfully.')},
            status=status.HTTP_204_NO_CONTENT
        )


class EducationalOrganizationView(APIView):
    """
    CRUD for EducationalOrganizations
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EducationalOrganizations.objects.filter(deleted_at__isnull=True)

    def get_object(self, pk):
        return get_object_or_404(self.get_queryset(), pk=pk)

    def get(self, request, pk=None):
        """
        - GET /organizations/ : list organizations
        - GET /organizations/<pk>/ : detail of a single organization
        """
        if pk:
            organization = self.get_object(pk)
            # Example permission check
            if not request.user.has_perm('educational_organizations_app.view_educationalorganizations'):
                return Response(
                    {'message': _('You do not have permission to view this organization.')},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = EducationalOrganizationsSerializer(organization)
            return Response(serializer.data)

        # List view
        if not request.user.has_perm('educational_organizations_app.view_educationalorganizations'):
            return Response(
                {'message': _('You do not have permission to view organizations.')},
                status=status.HTTP_403_FORBIDDEN
            )

        search_term = request.GET.get('searchTerm', '')
        qs = self.get_queryset()

        if search_term:
            # Example search across name, statement, address fields, district, division name, etc.
            qs = qs.filter(
                Q(name__icontains=search_term)
                | Q(statement__icontains=search_term)
                | Q(address_line1__icontains=search_term)
                | Q(address_line2__icontains=search_term)
                | Q(district__icontains=search_term)
                | Q(postal_code__icontains=search_term)
                | Q(division__name__icontains=search_term)
                | Q(under_category__name__icontains=search_term)
            )

        sort_columns = request.GET.getlist('sortColumns', None)
        if sort_columns:
            try:
                qs = qs.order_by(*sort_columns)
            except Exception:
                # Fallback if invalid sort columns
                qs = qs.order_by('-created_at')
        else:
            qs = qs.order_by('-created_at')

        serializer = EducationalOrganizationsSerializer(qs, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):
        """Create a new EducationalOrganization."""
        if not request.user.has_perm('educational_organizations_app.add_educationalorganizations'):
            return Response(
                {'message': _('You do not have permission to create an organization.')},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = EducationalOrganizationsSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def put(self, request, pk=None):
        """Update an existing EducationalOrganization."""
        if not request.user.has_perm('educational_organizations_app.change_educationalorganizations'):
            return Response(
                {'message': _('You do not have permission to update an organization.')},
                status=status.HTTP_403_FORBIDDEN
            )
        organization = self.get_object(pk)
        serializer = EducationalOrganizationsSerializer(
            instance=organization,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def delete(self, request, pk=None):
        """Soft-delete an existing EducationalOrganization."""
        if not request.user.has_perm('educational_organizations_app.delete_educationalorganizations'):
            return Response(
                {'message': _('You do not have permission to delete an organization.')},
                status=status.HTTP_403_FORBIDDEN
            )
        organization = self.get_object(pk)
        organization.deleted_at = timezone.now()
        organization.save()
        return Response(
            {'message': _('Organization deleted successfully.')},
            status=status.HTTP_200_OK
        )


# List all divisions or create a new one
class DivisionListCreateAPIView(APIView):

    def get(self, request):
        divisions = Division.objects.all()
        serializer = DivisionSerializer(divisions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DivisionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Retrieve, update, or delete a specific division
class DivisionDetailAPIView(APIView):

    def get_object(self, pk):
        return get_object_or_404(Division, pk=pk)

    def get(self, request, pk):
        division = self.get_object(pk)
        serializer = DivisionSerializer(division)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        division = self.get_object(pk)
        serializer = DivisionSerializer(division, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        division = self.get_object(pk)
        division.delete()  # Assuming SoftDeleteModel handles soft deletion
        return Response(status=status.HTTP_204_NO_CONTENT)
