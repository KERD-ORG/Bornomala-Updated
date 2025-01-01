from django.contrib import admin
from .models import *

# admin.site.register(Funding)
# admin.site.register(Benefit)
# class FundingAdmin(admin.ModelAdmin):
#     list_display = ["id" ,'name', "funding_type"]   
# admin.site.register(Funding, FundingAdmin)


from django.contrib import admin
from .models import Funding, Benefit

@admin.register(Funding)
class FundingAdmin(admin.ModelAdmin):
    list_display = ['get_funding_for', 'funding_type', 'amount', 'funding_open_date', 'funding_end_date']
    search_fields = ['funding_for', 'funding_type', 'amount']
    list_filter = ['funding_type', 'funding_for', ]
    readonly_fields = ['created_by', 'updated_by']
    
    def get_funding_for(self,obj):
        if obj.funding_for == Funding.FACULTY:
            return obj.funding_for_faculty_member if obj.funding_for_faculty_member else "Faculty"
        elif obj.funding_for == Funding.EDU_ORG:
            return obj.funding_for_edu_org if obj.funding_for_edu_org else "Educational Organizations"
        elif obj.funding_for == Funding.COLLEGE:
            return obj.funding_for_college if obj.funding_for_college else "College"
        elif obj.funding_for == Funding.DEPARTMENT:
            return obj.funding_for_dept if obj.funding_for_dept else "Department"
        elif obj.funding_for == Funding.OTHERS:
            return obj.funding_for_other_name if obj.funding_for_other_name else "Other"
        return "N/A"
    get_funding_for.short_description = "Funding for"

    def save_model(self, request, obj, form, change):
        if not obj.pk:  # If the object is being created
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return list(self.readonly_fields)
        return list(self.readonly_fields)

@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ['name', 'details']
    search_fields = ['name']
    list_filter = ['name']
