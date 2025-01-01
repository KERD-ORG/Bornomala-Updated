from django.contrib import admin

from common.models import *
from common.base_models import *

# Register your models here.

from .models import ResearchInterestOptions

@admin.register(ResearchInterestOptions)
class ResearchInterestOptionsAdmin(admin.ModelAdmin):
    list_display = ('topic', 'created_at', 'updated_at')
admin.site.register(Countries)
admin.site.register(GeoAdmin1)
admin.site.register(Document)
admin.site.register(GeoAdmin2)  
admin.site.register(State)

class CustomGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'college')
    filter_horizontal = ('permissions',)  # Enables the filter widget for permissions

    def get_form(self, request, obj=None, **kwargs):
        # Get the form and add the permissions field
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['permissions'].queryset = Permission.objects.all()  # Optional: filter permissions if needed
        return form

admin.site.register(CustomGroup, CustomGroupAdmin)