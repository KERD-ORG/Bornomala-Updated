from rest_framework import serializers
from .models import University

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'deleted_at', 'document']  # Include the file field here

    def validate_name(self, value):
        """
        Check that the name field is not empty.
        """
        if not value:
            raise serializers.ValidationError("This field cannot be blank.")
        return value

    def validate_description(self, value):
        """
        Check that the description field is not empty.
        """
        if not value:
            raise serializers.ValidationError("This field cannot be blank.")
        return value
