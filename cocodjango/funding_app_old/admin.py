from django.contrib import admin
from .models import *

admin.site.register(Funding)
admin.site.register(Benefit)
# class FundingAdmin(admin.ModelAdmin):
#     list_display = ["id" ,'name', "funding_type"]   
# admin.site.register(Funding, FundingAdmin)
