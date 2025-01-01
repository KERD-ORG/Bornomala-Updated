import os
import json
from django.core.management.base import BaseCommand , CommandError
from educational_organizations_app.models import EducationalOrganizationsCategory, EducationalOrganizations
from django.conf import settings
from common.models import Countries, GeoAdmin1, Document , State , GeoAdmin2  # Import related models
from django.contrib.auth.models import User,Group,Permission
from django.contrib.contenttypes.models import ContentType
from campus_app.models import Campus



class Command(BaseCommand):
    help = 'Load data from a JSON file into the database'

    def handle(self, *args, **kwargs):
        # Construct the file path
        json_file_path = os.path.join(settings.BASE_DIR,"" ,'all_data.json')

        # Read the JSON file
        with open(json_file_path, 'r') as file:
            data = json.load(file)

            for obj in data:
                model = obj.get('model')
                pk = obj.get('pk')
                fields = obj.get('fields')

                if model == 'educational_organizations_app.educationalorganizationscategory':
                    try:
                        category, created = EducationalOrganizationsCategory.objects.update_or_create(
                            id=pk,
                            defaults={
                                'name': fields.get('name'),
                                'description': fields.get('description')
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported category "{category}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import category with error: {str(e)}')
                elif model == 'common.Document':
                    try:
                        document, created = Document.objects.update_or_create(
                            id=pk,
                            defaults={
                                'type': fields.get('type'),
                                'user': User.objects.get(pk=fields.get('user')),
                                'file_name': fields.get('file_name'),
                                'file_name_system': fields.get('file_name_system'),
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported document "{document}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import document with error: {str(e)}')  
                elif model == 'common.state':
                    try:
                        state, created = State.objects.update_or_create(
                            id=pk,
                            defaults={                             
                                'name': fields.get('name'),
                                'country_id': fields.get('country_id'),
                                'country_code': fields.get('country_code'),
                                'fips_code': fields.get('fips_code'),
                                'iso2': fields.get('iso2'),
                                'type': fields.get('type'),
                                'latitude': fields.get('latitude'),
                                'longitude': fields.get('longitude'),
                                'created_at': fields.get('created_at'),
                                'updated_at': fields.get('updated_at'),
                                'flag': fields.get('flag'),
                                'wikiDataId': fields.get('wikiDataId'),
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported state "{state}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import state with error: {str(e)}')
                elif model == 'educational_organizations_app.educationalorganizations':
                    try:
                        print(fields)
                        category_instance = EducationalOrganizationsCategory.objects.get(id=fields.get('under_category'))
                        document_instance = Document.objects.get(id=fields.get('document'))
                        state_instance = State.objects.get(id=fields.get('state_province'))
                        organization = EducationalOrganizations.objects.update_or_create(
                            id=pk,
                            defaults={
                                "name": fields.get('name'),
                                "under_category": category_instance,
                                "web_address": fields.get('web_address'),
                                "statement": fields.get('statement'),
                                "document": document_instance,
                                "status": fields.get('status'),
                                "address_line1": fields.get('address_line1'),
                                "address_line2": fields.get('address_line2'),
                                "city": fields.get('city'),
                                "state_province": state_instance,
                                "postal_code": fields.get('postal_code'),
                                "country_code": fields.get('country_code'),
                            }
                        )           
                                
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported organization "{organization}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import organization with error: {str(e)}')
                elif model == 'common.Countries':
                    try:
                        print(fields)
                        country , created = Countries.objects.update_or_create(
                            id=pk,
                            defaults={
                                'country_name': fields.get('country_name'),
                                "country_code": fields.get('country_code'),
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported country "{country}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import country with error: {str(e)}')
                elif model == 'common.GeoAdmin1':
                    try:
                        country_instance = Countries.objects.filter(pk=fields.get('country')).first()
                        geo_admin_1 , created = GeoAdmin1.objects.update_or_create(
                            id=pk,
                            defaults={
                                'country': country_instance,
                                'geo_admin_1_code': fields.get('geo_admin_1_code'),
                                'geo_admin_1_name': fields.get('geo_admin_1_name'),
                            }
                        )       
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported geo_admin_1 "{geo_admin_1}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import geo_admin_1 with error: {str(e)}')
                elif model == 'common.GeoAdmin2':
                    try:
                        country_instance = Countries.objects.filter(pk=fields.get('country')).first()
                        geo_admin_1_instance = GeoAdmin1.objects.filter(pk=fields.get('geo_admin_1')).first()
                        geo_admin_2 , created = GeoAdmin2.objects.update_or_create(
                            id=pk,
                            defaults={
                                'country': country_instance,
                                'geo_admin_1': geo_admin_1_instance,
                                'geo_admin_2_code': fields.get('geo_admin_2_code'),
                                'geo_admin_2_name': fields.get('geo_admin_2_name'),
                            }
                        )   
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported geo_admin_2 "{geo_admin_2}"')) 
                    except Exception as e:
                        raise CommandError(f'Failed to import geo_admin_2 with error: {str(e)}')
                elif model == 'campus_app.campus': 
                    try:
                        edu_inst = EducationalOrganizations.objects.get(pk=fields.get('educational_organization'))
                        state_instance = State.objects.get(pk=fields.get('state_province'))
                        campus , created = Campus.objects.update_or_create (
                            id=pk,
                            defaults = {
                                'campus_name': fields.get('campus_name'),
                                'educational_organization': edu_inst,
                                'address_line1': fields.get('address_line1'),
                                'address_line2': fields.get('address_line2'),
                                'city': fields.get('city'),
                                'state_province': state_instance,
                                'postal_code': fields.get('postal_code'),
                                'country_code': fields.get('country_code'),
                                'statement': fields.get('statement'),
                                'status': fields.get('status'),
                            }
                        )     
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported campus "{campus}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import campus with error: {str(e)}')
                elif model == 'college_app.college':
                    try:
                        campus_inst = Campus.objects.get(pk=fields.get('campus'))
                        state_instance = State.objects.get(pk=fields.get('state_province'))
                        college , created = College.objects.update_or_create (
                            id=pk,
                            defaults = {    
                                "name": fields.get('name'),
                                "campus": campus_inst,
                                "web_address": fields.get('web_address'),
                                "address_line1": fields.get('address_line1'),
                                "address_line2": fields.get('address_line2'),
                                "city": fields.get('city'),
                                "state_province": state_instance,
                                "postal_code": fields.get('postal_code'),
                                "country_code": fields.get('country_code'),
                                "statement": fields.get('statement'),
                                "status": fields.get('status'),         
                            }
                        )     
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported college "{college}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import college with error: {str(e)}')
                elif model== "department_app.department":
                    try:
                        collage_inst = College.objects.get(pk=fields.get('college'))
                        campus_inst = Campus.objects.get(pk=fields.get('campus'))
                        state_instance = State.objects.get(pk=fields.get('state_province'))
                        department , created = Department.objects.update_or_create (
                            id=pk,
                            defaults = {
                                'name': fields.get('name'),
                                'college': collage_inst,
                                'campus': campus_inst,
                                'web_address': fields.get('web_address'),
                                'address_line1': fields.get('address_line1'),
                                'address_line2': fields.get('address_line2'),
                                'city': fields.get('city'),
                                'state_province': state_instance,
                                'postal_code': fields.get('postal_code'),
                                'country_code': fields.get('country_code'),
                                'statement': fields.get('statement'),
                                'status': fields.get('status'),                                        
                            }
                        )     
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported department "{department}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import department with error: {str(e)}')
                elif model == "faculty_members_app.facultymembers":
                    try:
                        user_instance = User.objects.get(pk=fields.get('user'))
                        edu_inst = EducationalOrganizations.objects.get(pk=fields.get('educational_organization'))
                        department_inst = Department.objects.get(pk=fields.get('department'))
                        campus_inst = Campus.objects.get(pk=fields.get('campus'))
                        college_inst = College.objects.get(pk=fields.get('college'))
                        state_instance = State.objects.get(pk=fields.get('state_province'))
                        faculty , created = FacultyMembers.objects.update_or_create (
                            id=pk,
                            defaults = {
                                'user': user_instance,
                                'educational_organization': edu_inst,
                                'department': department_inst,
                                'campus': campus_inst,
                                'college': college_inst,
                                'personal_web_address': fields.get('personal_web_address'),
                                'research_profile_address': fields.get('research_profile_address'),
                                'orcid': fields.get('orcid'),
                                'faculty_type': fields.get('faculty_type'),
                                'address_line1' : fields.get('address_line1'),
                                'address_line2' : fields.get('address_line2'),
                                'city' : fields.get('city'),
                                'state_province' : state_instance,
                                'postal_code' : fields.get('postal_code'),
                                'country_code' : fields.get('country_code'),
                                'statement' : fields.get('statement'),
                                'status' : fields.get('status'),
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported faculty "{faculty}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import faculty with error: {str(e)}')
                elif model == "funding_app.benefit":
                    try:
                        benefit , created = Benefit.objects.update_or_create (
                            id=pk,
                            defaults = {
                                'name': fields.get('name'),
                                'details': fields.get('details'),
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported benefit "{benefit}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import benefit with error: {str(e)}')
                elif model == "funding_app.funding":
                   try:
                        edu_inst = EducationalOrganizations.objects.get(pk=fields.get('originator_edu_org'))
                        benefit_ids = fields.get('benefits')
                        benefit_instances = Benefit.objects.filter(pk__in=benefit_ids)
                        
                        funding_for = fields.get('funding_for')
                        funding_for_faculty = None
                        funding_for_department = None
                        
                        if funding_for == "Faculty":
                            faculty_inst = FacultyMembers.objects.get(pk=fields.get('funding_for_faculty'))
                            funding_for_faculty = faculty_inst
                        elif funding_for == "Department":
                            department_inst = Department.objects.get(pk=fields.get('funding_for_department'))
                            funding_for_department = department_inst

                        funding, created = Funding.objects.update_or_create(
                            id=pk,
                            defaults={
                                'originator': fields.get('originator'),
                                'originator_edu_org': edu_inst,
                                'funding_type': fields.get('funding_type'),
                                'amount': fields.get('amount'),
                                'amount_type': fields.get('amount_type'),
                                'funding_for': funding_for,
                                'funding_for_faculty': funding_for_faculty,
                                'funding_for_department': funding_for_department,
                                'funding_open_date': fields.get('funding_open_date'),
                                'funding_end_date': fields.get('funding_end_date'),
                            }
                        )
                        funding.benefits.set(benefit_instances)
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported funding "{funding}"'))
                   except Exception as e:
                        raise CommandError(f'Failed to import funding with error: {str(e)}')
                elif model == 'auth.Group':
                    try:
                        exist_group = Group.objects.filter(name = fields.get('name')).first()
                        if exist_group is not None:
                            exist_group.delete()
                        group = Group.objects.create(name=fields.get('name'))
                        group.pk = pk
                        group.save()
                        all_permissions = Permission.objects.all()
                        for permission in all_permissions:
                            group.permissions.add(permission)
                        group.save()
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported group "{group}"'))
                    except Exception as e:
                        raise CommandError(f'Failed to import group with error: {str(e)}')
                elif model == "auth.User":
                    try:
                        exist_user = User.objects.filter(username = fields.get('username')).first()
                        if exist_user is not None:  
                            return
                        exist_email = User.objects.filter(email = fields.get('email')).first()
                        if exist_email is not None:
                            return
                        exist_1st = User.objects.filter(pk = pk).first()
                        if exist_1st is not None:
                            return
                        user = User.objects.create_superuser(fields.get('username'), fields.get('email'), fields.get('password'))
                        user.pk = pk
                        user.save()
                        all_group = Group.objects.all()
                        for group in all_group:
                            user.groups.add(group)
                        user.save()
                        all_permissions = Permission.objects.all()
                        for permission in all_permissions:
                            user.user_permissions.add(permission)
                        user.save()
                        print(user.pk)
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported user "{user}"'))
                    except Exception as e:
                        pass
                    
                else:
                    raise CommandError(f'Unknown model "{model}" found in JSON data.')

        self.stdout.write(self.style.SUCCESS('Data import completed successfully'))