from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.translation import gettext_lazy
from .models import PasswordResetToken, ExtendedUser
from profile_app.models import UserDetails
import re
from django.shortcuts import get_object_or_404

class UserSerializer(serializers.ModelSerializer):
    
    username = serializers.CharField(max_length=150, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 150 characters."),
    })
    first_name = serializers.CharField(max_length=150, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 150 characters."),
    })
    last_name = serializers.CharField(max_length=150, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 150 characters."),
    })
    email = serializers.CharField(max_length=254, error_messages={
        'max_length': gettext_lazy("Ensure this field has no more than 254 characters."),
    })
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'id','date_joined', 'is_active']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'password': {'write_only': True},
            'id': {'read_only': True}
        }

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("This field is required."))

        try:
            django_validate_email(value.strip())  
        except DjangoValidationError:
            raise serializers.ValidationError(gettext_lazy("Enter a valid email address."))
        
        # Get the current user's ID (self.instance is the user being updated)
        if self.instance:
            # Check if the email exists for a different user
            if User.objects.filter(email=value.strip()).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError(gettext_lazy("A user with that email already exists."))
        
        return value.strip()

    
  
    def validate_first_name(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("This field is required."))
            
        return value.strip()  
    
    def validate_last_name(self, value):
        if not value:
            raise serializers.ValidationError(gettext_lazy("This field is required."))
            
        return value.strip()  
    
    def validate_password(self, value):
        validate_password(value.strip())  
        return value.strip()  
    
    def validate(self, data):
        if not data.get('first_name'):
            raise serializers.ValidationError({"first_name": gettext_lazy("This field is required.")})
        if not data.get('last_name'):
            raise serializers.ValidationError({"last_name": gettext_lazy("This field is required.")})
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

        
        
class ExtendedUserSerializer(serializers.ModelSerializer):
    middle_name = serializers.CharField(max_length=30, required=False)

    class Meta:
        model = ExtendedUser
        fields = ['middle_name']

    def validate_middle_name(self, value):
        if value is not None:
            return value.strip()  
        return value  
        
def validate_reset_token(token):
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return None

    if reset_token.expiry_time < timezone.now():
        return None

    user = reset_token.user
    if not default_token_generator.check_token(user, token):
        return None

    return user

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": gettext_lazy("Passwords do not match.")})
        token = data.get('token')
        user = validate_reset_token(token)
        if not user:
            raise serializers.ValidationError({"token": gettext_lazy("Invalid or expired token.")})
        
        return data

    def save(self):
        token = self.validated_data['token']
        password = self.validated_data['password']

        user = validate_reset_token(token)
        if not user:
            raise serializers.ValidationError({"token": gettext_lazy("Invalid or expired token.")})

        user.set_password(password)
        user.save()
        return user
    


    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=254, error_messages={
        'max_length': gettext_lazy(gettext_lazy("Ensure this field has no more than 254 characters.")),
    })
    password = serializers.CharField(required=True)
    otp = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        # Strip whitespace from the username
        value = value.strip()

        # Check if the identifier is an email
        email_regex = re.compile(r'^\S+@\S+\.\S+$')
        is_email = email_regex.match(value) is not None

        if is_email and len(value) > 254:
            raise serializers.ValidationError(gettext_lazy("Email should not exceed 254 characters."))
        elif not is_email and len(value) > 150:
            raise serializers.ValidationError(gettext_lazy("Username should not exceed 150 characters."))

        return value
    
    
class GroupSerializer(serializers.Serializer):
    role = serializers.CharField(max_length=150)
    def validate_role(self, value):
        try:
            group = Group.objects.get(name=value)
            print(group)
        except Group.DoesNotExist:
            raise serializers.ValidationError(gettext_lazy("Role '{value}' does not exist.").format(value=value))
        return value