# auth_app/admin.py
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.contrib.auth.models import User
from django.contrib import admin
from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import ExtendedUser
from profile_app.models import UserDetails

class ExtendedUserInline(admin.StackedInline):
    model = ExtendedUser
    can_delete = False
    verbose_name_plural = 'Extended User Info'
    
class UserDetailsInline(admin.StackedInline):
    model = UserDetails
    can_delete = False
    verbose_name_plural = 'User Details Info'
    

class CustomUserAdmin(DefaultUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ('username', 'email', 'first_name', 'get_middle_name' , 'last_name', 'is_active', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active',)
    
    def get_middle_name(self, obj):
        return obj.extendeduser.middle_name if hasattr(obj, 'extendeduser') else None  # Access middle_name through ExtendedUser
    get_middle_name.short_description = 'Middle Name'  


    inlines = (ExtendedUserInline, UserDetailsInline)  # Add the inline here

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
