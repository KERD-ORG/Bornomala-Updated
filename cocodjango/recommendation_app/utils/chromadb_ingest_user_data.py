from django.core.management.base import BaseCommand
from sentence_transformers import SentenceTransformer
import chromadb
import os
import copy
import time
import re
from datetime import datetime
from bs4 import BeautifulSoup
from .text_loader_from_file import TextLoader
from django.conf import settings
# from ..utils import UserDataService
from common.models import SoftDeleteModel
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from profile_app.models import UserDetails
from faculty_members_app.models import FacultyMembers
from services.user_data_service import UserDataService
from services.researcher_data_service import ResearcherDataService
from services.college_data_service import  CollegeDataService
from services.department_data_service import  DepartmentDataService
from services.program_data_service import ProgramDataService
from ..models import Funding
from college_app.models import College
from department_app.models import Department
from educational_organizations_app.models import EducationalOrganizations
from campus_app.models import Campus
from program_app.models import Program
from openai import OpenAI
import json




class DjangoToChromaDBIngest:
    def __init__(self, embedding_function, output_path=None):
        self.embedding_function = embedding_function
        if output_path:
            if not os.path.exists(output_path):
                os.makedirs(output_path)
        self.output_path = output_path

    def get_embedding(self, text):
        return self.embedding_function.encode(text).tolist()

    def ingest_researcher_user_documents(self):
        # users = UserDetails.objects.all()
        
        client = chromadb.PersistentClient(path=self.output_path)
        try:
            client.delete_collection(name="researcher_user_documents")
        except Exception as e:
            print("Collection doesn't exist or failed to delete:", e)
        
        collection = client.create_collection(name="researcher_user_documents", metadata={"hnsw:space": "cosine"})

        # user_list = UserDataService.get_all_flat_users_data(group_name='Student')
        research_roles = [
        'Professor', 'Researcher', 'Lecturer', 'Assistant Professor',
        'Associate Professor',
        'Postdoctoral Researcher', 'Visiting Scholar',  'Clinical Faculty',
        'Adjunct Faculty', 'Faculty Emeritus']

        user_list = ResearcherDataService.get_all_flat_users_data(user_types=research_roles)
 
        # print("user_list:", user_list)

        for user_data in user_list:
            user_info =  user_data['user_main'][0]
            user_details = user_data['user_details']
            del user_data['user_details']
            del user_data['user_main']
            user_data.update(user_details)
            user_data.update(user_info) 
        
            user_id = user_info['user_id']
            # sop_path = user['sop'][0]['url']
            # resume_path = user['resume'][0]['url']

            # print("user_info:", user_info)
            # print("user_sop path:", sop_path)

            embedding_id = f"{user_id}"
            metadata = user_data
            # for k, v in metadata.items():
            #     if v is None:
                    # print("None type:")
                    # print(k)

            resume_text = "" 
            if len(user_data['resume']) > 0:
                if "url" in user_data['resume'][0]:
                    resume_file_path = str(settings.MEDIA_ROOT )+ "/" +os.path.basename(user_data['resume'][0]['url'])
                    resume_text = TextLoader.get_text_from_file(resume_file_path)
            sop_text = ""
            if len(user_data['sop']) > 0:
                if "url"  in user_data['sop'][0]:
                    
            
                    sop_file_path = str(settings.MEDIA_ROOT ) + "/" +os.path.basename(user_data['sop'][0]['url'])
                    sop_text = TextLoader.get_text_from_file(sop_file_path)
            
            if user_data['department'] is not None:
                department_name = Department.objects.get(id=user_data['department'] ).name
                user_data['department_name']  = department_name
            
            if user_data['college'] is not None:
                college_name = College.objects.get(id=user_data['college'] ).name
                user_data['college_name']  = college_name

            if user_data['campus'] is not None:
                campus_name = Campus.objects.get(id=user_data['campus'] ).campus_name
                user_data['campus_name'] = campus_name

            if user_data['organization'] is not None:
                organization_name = EducationalOrganizations.objects.get(id=user_data['organization'] ).name
                user_data['organization_name'] = organization_name


            # print(flat_data["resume_0_url"])
            # print(os.path.realpath(os.path.join(os.getcwd(), "../..", flat_data["resume_0_url"])))
           
            # resume_text = TextLoader.get_text_from_file(flat_data["resume_0_url"])
            
            # sop_text = TextLoader.get_text_from_file( flat_data["sop_0_url"])
            # print(sop_text[:100]) 
            # print("resume text:")
            # print(resume_text[:100])
                
            # Extract funding details
            funding_metadata = self.extract_funding_data(user_data)
            # print("funding_metadata:", funding_metadata) 

            # Initialize an empty list to store formatted strings
            publication_strings = []

            # Iterate over the data keys
            i = 0
            while f"publication_{i}_title" in user_data and f"publication_{i}_abstract" in user_data:
                title = user_data[f"publication_{i}_title"]
                abstract = user_data[f"publication_{i}_abstract"]
                publication_strings.append(f'publication title: "{title}", publication abstract: "{abstract}"')
                i += 1

            funding_text_to_embed = ""
            for i, desc in enumerate(funding_metadata['description']):
                funding_text_to_embed= "Funding Details: \nTitle: " +  funding_metadata['title_of_funding'][i] + " \n Description " + desc + "\n"

            del funding_metadata['description']
            del funding_metadata['title_of_funding']

            # Join all publication strings into one string
            result_string = ", ".join(publication_strings)

            total_text = ""

            if resume_text != "":
                total_text += "Resume: " + resume_text
            if sop_text != "":
                total_text += "Statement of purpose: " + sop_text
            
            total_text =funding_text_to_embed +  total_text + result_string
            # print(total_text)


            del metadata['sop']
            del metadata['resume']
            # filtered_metadata = self.metadata_filtering(metadata)

        

            vector_metadata = {
                "user_id": metadata['user_id'],
                "name": metadata['first_name'] + " " + metadata['last_name'],
                "type": metadata['user_type'],
                "college_id": "" if metadata['college'] is None else metadata['college'],
                # "college_web_address": metadata['college_web_address'],
                "college_name": "" if "college_name" not in  metadata else metadata['college_name'],
                "campus_id": "" if metadata['campus'] is None else metadata['campus'],
                "campus_name":"" if "campus_name" not in  metadata else metadata['campus_name'],
                "organization_id": metadata['organization'],
                "department_name":""  if "department_name" not in  metadata else metadata['department_name'],
                "department_id": "" if metadata['department'] is None else metadata['department'], 
                # "organization_web_address": metadata['organization_web_address'],
                # "under_category_name": metadata['under_category_name'],
                "organization_name": metadata['organization_name'],
                # "country_name": metadata['country_name'],
                # "country_code": metadata['country_code'],
                # "state_province_name": metadata['state_province_name'],
                "city": "" if metadata['current_city'] is None else metadata['current_city'],
                "funding_available": "True" if len(funding_metadata['funding_id']) > 0 else "False",
                "funding_for": "|".join(funding_metadata['funding_for']),  # 'International|International'
                "funding_type": "|".join(funding_metadata['funding_type']),  # 'RA|TA'
                "funding_opportunity_for": "|".join(funding_metadata['funding_opportunity_for']),# 'International|International'
              
            }
            print("vector_metadata:", vector_metadata)
            
            collection.add(
                documents=[total_text],
                metadatas=[vector_metadata],
                ids=[embedding_id]
            )
        print("researcher injesting done")
        
       
    def ingest_student_user_documents(self):
            # users = UserDetails.objects.all()
            
            client = chromadb.PersistentClient(path=self.output_path)
            try:
                client.delete_collection(name="student_user_documents")
            except Exception as e:
                print("Collection doesn't exist or failed to delete:", e)
            
            collection = client.create_collection(name="student_user_documents", metadata={"hnsw:space": "cosine"})

            user_list = UserDataService.get_all_flat_users_data(group_name='Student')
        
    
            # print("user_list:", user_list)

            for user in user_list:
                user_info =  user['user_main'][0]
                user_details = user['user_details']
                del user['user_details']
                del user['user_main']
                user.update(user_details)
                user.update(user_info)
             
                user_id = user_info['user_id']
                # sop_path = user['sop'][0]['url']
                # resume_path = user['resume'][0]['url']

                print("user_info:", user_info)
                # print("user_sop path:", sop_path)

                embedding_id = f"{user_id}"
                metadata = user
                # for k, v in metadata.items():
                #     if v is None:
                #         print("None type:")
                #         print(k)

                resume_text = "" 
                if len(user['resume']) > 0:
                    if "url" in user['resume'][0]:
                        resume_file_path = str(settings.MEDIA_ROOT )+ "/" +os.path.basename(user['resume'][0]['url'])
                        resume_text = TextLoader.get_text_from_file(resume_file_path)
                sop_text = ""
                if len(user['sop']) > 0:
                    if "url"  in user['sop'][0]:
                        
                
                        sop_file_path = str(settings.MEDIA_ROOT ) + "/" +os.path.basename(user['sop'][0]['url'])
                        sop_text = TextLoader.get_text_from_file(sop_file_path)
                

                # print(flat_data["resume_0_url"])
                # print(os.path.realpath(os.path.join(os.getcwd(), "../..", flat_data["resume_0_url"])))
            
                # resume_text = TextLoader.get_text_from_file(flat_data["resume_0_url"])
                
                # sop_text = TextLoader.get_text_from_file( flat_data["sop_0_url"])
                print(sop_text[:100]) 
                print("resume text:")
                print(resume_text[:100])

                # Initialize an empty list to store formatted strings
                publication_strings = []

                # Iterate over the data keys
                i = 0
                while f"publication_{i}_title" in user and f"publication_{i}_abstract" in user:
                    title = user[f"publication_{i}_title"]
                    abstract = user[f"publication_{i}_abstract"]
                    publication_strings.append(f'publication title: "{title}", publication abstract: "{abstract}"')
                    i += 1
    

                # Join all publication strings into one string
                result_string = ", ".join(publication_strings)

                total_text = ""

                if resume_text != "":
                    total_text += "Resume: " + resume_text
                if sop_text != "":
                    total_text += "Statement of purpose: " + sop_text
                
                total_text = total_text + result_string
                print(total_text)


                del metadata['sop']
                del metadata['resume']
                filtered_metadata = self.metadata_filtering(metadata)

                print("metadata:")
                print(filtered_metadata)

                
                collection.add(
                    documents=[total_text],
                    metadatas=[filtered_metadata],
                    ids=[embedding_id]
                )
            print("student ingesting done")

    # def ingest_faculty_documents(self):
    #     faculty_members = Funding.objects.all()
        
    #     client = chromadb.PersistentClient(path=self.output_path)
    #     try:
    #         client.delete_collection(name="faculty_documents")
    #     except Exception as e:
    #         print("Collection doesn't exist or failed to delete:", e)
        
    #     collection = client.create_collection(name="faculty_documents", metadata={"hnsw:space": "cosine"})
        
       
        
    #     for funding in faculty_members:
    #         funding_id = funding.id
    #         funding_document_path = funding.funding_document_path
    #         file_path = str(settings.BASE_DIR) + "/" +funding_document_path
    #         funding_text = TextLoader.get_text_from_file(file_path)
    #         # funding_text = open(funding_document_path).read()
    #         # funding_embedding = self.get_embedding(funding_text)
            
    #         print(funding_text)
    #         # Insert embedding into ChromaDB
    #         embedding_id = f"funding_{funding_id}"
    #         metadata = {
    #             "university": funding.university,
    #             "department": funding.department,
    #             "professor": funding.professor,
    #             "minimum_cgpa": float(funding.minimum_cgpa),
    #             "required_ielts_score": float(funding.required_ielts_score)
    #         }
            
    #         collection.add(
    #             documents = [funding_text],
    #             metadatas = [metadata],
    #             ids = [embedding_id]
    #         )

    #     print("funding data ingest done")

    #     return 0
    
    def ingest_college_documents(self):
        colleges = College.objects.all()
        
        client = chromadb.PersistentClient(path=self.output_path)
        try:
            client.delete_collection(name="college_documents")
        except Exception as e:
            print("Collection doesn't exist or failed to delete:", e)
        
        collection = client.create_collection(name="college_documents", metadata={"hnsw:space": "cosine"})
        
        # college_flat_data = CollegeDataService.get_all_flat_colleges_data()
        # print("college flat data: ")
        # print(college_flat_data)
        
        for college in colleges:
            college_id = college.id
            print("college_id: ", college_id)
            # funding_document_path = college.funding_document_path
            # file_path = str(settings.BASE_DIR) + "/" +funding_document_path
            # funding_text = TextLoader.get_text_from_file(file_path)
            # funding_text = open(funding_document_path).read()
            # funding_embedding = self.get_embedding(funding_text)
            

             # Get flat user data
            college_data_service = CollegeDataService(college.id)
            # flat_data = college_data_service.get_flat_college_data()

            flat_data = college_data_service.get_flat_college_data()
            print(flat_data)
            print("extracted metadata: ")
            metadata = self.extract_metadata(flat_data)
            print(metadata)

            # print(funding_text)
            # Insert embedding into ChromaDB
            embedding_id = f"college_{metadata['college_id']}"
            vector_metadata = {
                "college_id": metadata['college_id'],
                "college_web_address": metadata['college_web_address'],
                "college_name": metadata['college_name'],
                "campus_id": metadata['campus_id'],
                "campus_name": metadata['campus_name'],
                "organization_id": metadata['organization_id'],
                "organization_web_address": metadata['organization_web_address'],
                "under_category_name": metadata['under_category_name'],
                "organization_name": metadata['organization_name'],
                "country_name": metadata['country_name'],
                "country_code": metadata['country_code'],
                "state_province_name": metadata['state_province_name'],
                "city": metadata['city'],
              
            }
            
            
            collection.add(
                documents = [metadata['statement']],
                metadatas = [vector_metadata],
                ids = [embedding_id]
            )

        print("college data ingest done")

        return 0

    def ingest_dept_documents(self):
            depts = Department.objects.all()
            
            client = chromadb.PersistentClient(path=self.output_path)
            try:
                client.delete_collection(name="dept_documents")
            except Exception as e:
                print("Collection doesn't exist or failed to delete:", e)
            
            collection = client.create_collection(name="dept_documents", metadata={"hnsw:space": "cosine"})
            
            # college_flat_data = CollegeDataService.get_all_flat_colleges_data()
            # print("college flat data: ")
            # print(college_flat_data)
            
            for dept in depts:
                dept_id = dept.id
                print("dept_id: ", dept_id)
                # funding_document_path = college.funding_document_path
                # file_path = str(settings.BASE_DIR) + "/" +funding_document_path
                # funding_text = TextLoader.get_text_from_file(file_path)
                # funding_text = open(funding_document_path).read()
                # funding_embedding = self.get_embedding(funding_text)
                

                # Get flat user data
                dept_data_service = DepartmentDataService(dept.id)
                # flat_data = college_data_service.get_flat_college_data()

                flat_data = dept_data_service.get_flat_department_data()
                print(flat_data)
                print("extracted metadata: ")
                metadata = self.extract_metadata_department(flat_data)
                print(metadata)

                # print(funding_text)
                # Insert embedding into ChromaDB
                embedding_id = f"dept_{metadata['department_id']}"
                vector_metadata = {
                    "dept_id": metadata['department_id'], 
                    "dept_id_web_address": metadata['department_web_address'],
                    "dept_name": metadata['department_name'],
                    "college_name": metadata['college_name'],
                    "campus_id": metadata['campus_id'],
                    "campus_name": metadata['campus_name'],
                    "organization_id": metadata['organization_id'],
                    "organization_web_address": metadata['organization_web_address'],
                    "under_category_name": metadata['under_category_name'],
                    "organization_name": metadata['organization_name'],
                    "country_name": metadata['country_name'],
                    "country_code": metadata['country_code'],
                    "state_province_name": metadata['state_province_name'],
                    "city": metadata['city'],
                
                }
                
                
                collection.add(
                    documents = [metadata['statement']],
                    metadatas = [vector_metadata],
                    ids = [embedding_id]
                )

            print("dept data ingest done")

            return 0
    
    def ingest_program_documents(self):
        programs = Program.objects.all()
        
        client = chromadb.PersistentClient(path=self.output_path)
        try:
            client.delete_collection(name="program_documents")
        except Exception as e:
            print("Collection doesn't exist or failed to delete:", e)
        
        collection = client.create_collection(name="program_documents", metadata={"hnsw:space": "cosine"})
        
        for program in programs:
            program_id = program.id
            print("program_id:", program_id)
            
            # Initialize ProgramDataService to get flattened program data
            program_data_service = ProgramDataService(program.id)
            flat_data = program_data_service.get_flat_program_data()
            print(flat_data)
            
            # Extract relevant metadata for the program
            metadata = self.extract_metadata_program(flat_data)

            # Extract funding details
            funding_metadata = self.extract_funding_data(flat_data)
            print("extracted metadata:", metadata)

            # Create unique embedding ID for each program
            embedding_id = f"program_{metadata['program_id']}"

            # construct text
            program_text_to_embed = ""
            if metadata['program_description'] != "":
                program_text_to_embed ="Program Description: \n" +  metadata['program_description']
            for i, desc in enumerate(funding_metadata['description']):
                program_text_to_embed+= "Funding Details: \nTitle: " +  funding_metadata['title_of_funding'][i] + " \n Description " + desc + "\n"

            del funding_metadata['description']
            del funding_metadata['title_of_funding']
            vector_metadata = {
                "program_id": metadata['program_id'],
                "program_title": metadata['program_title'],
                # "program_description": metadata['program_description'],
                "funding_available": "True" if len(funding_metadata['funding_id']) > 0 else "False",
                "funding_for": "|".join(funding_metadata['funding_for']),  # 'International|International'
                "funding_type": "|".join(funding_metadata['funding_type']),  # 'RA|TA'
                "funding_opportunity_for": "|".join(funding_metadata['funding_opportunity_for']),# 'International|International'
                "IELTS": metadata['IELTS'],
                "TOEFL": metadata['TOEFL'], 
                "GRE": metadata['GRE'],
                "DUOLINGO": metadata['DUOLINGO'],
                "CGPA": metadata['CGPA'],
                "application_process": metadata['application_process'],
                "application_fee": metadata['application_fee'],
                "application_end_date": metadata['application_end_date'] ,
                "department_name": metadata['department_name'],
                "college_name": metadata['college_name'],
                "campus_name": metadata['campus_name'],
                "organization_name": metadata['organization_name'],
                "country_code": metadata['country_code'],
                "country_name": metadata['country_name'],
                "state_province_name": metadata['state_province_name'],
                "city": metadata['city'],
            }

            # vector_metadata.update(funding_metadata)

            print("Metadata: ", vector_metadata)
            # print("Text: ", program_text_to_embed)
            
            # Insert embedding into ChromaDB
            collection.add( 
                documents=[program_text_to_embed],
                metadatas=[vector_metadata],
                ids=[embedding_id]
            )

        print("program data ingest done")

        return 0


    def metadata_filtering(self, metadata):
        print(metadata)
        filtered_metadata = copy.deepcopy(metadata)
       
        excluding_fields = ['deleted_at', 'created_at', "sop", "resume", "groups", "custom_groups", "date_joined" ]
        for k, v in metadata.items():
            if any(substring in k for substring in excluding_fields):
                del filtered_metadata[k]
        for k, v in filtered_metadata.items():
            if v is None:
                filtered_metadata[k] = "None"

        filtered_metadata = {key: value for key, value in filtered_metadata.items() if not key.startswith("publication")}
        # print(filtered_metadata)
        return filtered_metadata
    
    def extract_metadata(self,flat_data):
        metadata = {}
 
        # Helper function to safely get keys
        def safe_get_key(prefix, suffix):
            try:
                return next(key for key in flat_data if key.startswith(prefix) and key.endswith(suffix))
            except StopIteration:
                return None

        # Extract college details
        college_id_key = safe_get_key("college_", "_id")
        if college_id_key:
            college_id = flat_data[college_id_key]
            metadata['college_id'] = college_id

            college_web_address_key = safe_get_key(f"college_{college_id}_", "_web_address")
            metadata['college_web_address'] = flat_data.get(college_web_address_key)

            college_statement_key = safe_get_key(f"college_{college_id}_", "_statement")
            metadata['statement'] = flat_data.get(college_statement_key)

            college_name = safe_get_key(f"college_{college_id}_", "_name")
            metadata['college_name'] = flat_data.get(college_name) 

        # Extract campus details
        campus_id_key = safe_get_key("campus_", "_id")
        if campus_id_key:
            campus_id = flat_data[campus_id_key]
            metadata['campus_id'] = campus_id

            campus_web_address_key = safe_get_key(f"campus_{campus_id}_", "_web_address")
            metadata['campus_web_address'] = flat_data.get(campus_web_address_key)

            campus_name = safe_get_key(f"campus_{campus_id}_", "_name")
            metadata['campus_name'] = flat_data.get(campus_name)

        # Extract organization details
        organization_id_key = safe_get_key("organization_", "_id")
        if organization_id_key:
            organization_id = flat_data[organization_id_key]
            metadata['organization_id'] = organization_id

            organization_web_address_key = safe_get_key(f"organization_{organization_id}_", "_web_address")
            metadata['organization_web_address'] = flat_data.get(organization_web_address_key)

            under_category_name_key = safe_get_key(f"organization_{organization_id}_", "_under_category_name")
            metadata['under_category_name'] = flat_data.get(under_category_name_key)

            organization_name_key = safe_get_key(f"organization_{organization_id}_", "_name")
            metadata['organization_name'] = flat_data.get(organization_name_key)

        # Extract common details
        country_name_key = safe_get_key("", "_country_name")
        metadata['country_name'] = flat_data.get(country_name_key)

        country_code_key = safe_get_key("", "_country_code")
        metadata['country_code'] = flat_data.get(country_code_key)

        state_province_name_key = safe_get_key("", "_state_province_name")
        metadata['state_province_name'] = flat_data.get(state_province_name_key)

        city_key = safe_get_key("", "_city")
        metadata['city'] = flat_data.get(city_key)

        return metadata
    

    def extract_metadata_department(self,flat_data):
            metadata = {}

            # Helper function to safely get keys
            def safe_get_key(prefix, suffix):
                try:
                    return next(key for key in flat_data if key.startswith(prefix) and key.endswith(suffix))
                except StopIteration:
                    return None

            # Extract dept details
            dept_id_key = safe_get_key("department_", "_id")
            if dept_id_key:
                dept_id = flat_data[dept_id_key]
                metadata['department_id'] = dept_id

                college_web_address_key = safe_get_key(f"department_{dept_id}_", "_web_address")
                metadata['department_web_address'] = flat_data.get(college_web_address_key)

                college_statement_key = safe_get_key(f"department_{dept_id}_", "_statement")
                metadata['statement'] = flat_data.get(college_statement_key)

                college_name = safe_get_key(f"department_{dept_id}_", "_name")
                metadata['department_name'] = flat_data.get(college_name) 

            college_id_key = safe_get_key("college_", "_id")
            if college_id_key:
                college_id = flat_data[college_id_key]
                metadata['college_id'] = college_id

                college_web_address_key = safe_get_key(f"college_{college_id}_", "_web_address")
                metadata['college_web_address'] = flat_data.get(college_web_address_key)

                college_statement_key = safe_get_key(f"college_{college_id}_", "_statement")
                metadata['statement'] = flat_data.get(college_statement_key)

                college_name = safe_get_key(f"college_{college_id}_", "_name")
                metadata['college_name'] = flat_data.get(college_name) 

            # Extract campus details
            campus_id_key = safe_get_key("campus_", "_id")
            if campus_id_key:
                campus_id = flat_data[campus_id_key]
                metadata['campus_id'] = campus_id

                campus_web_address_key = safe_get_key(f"campus_{campus_id}_", "_web_address")
                metadata['campus_web_address'] = flat_data.get(campus_web_address_key)

                campus_name = safe_get_key(f"campus_{campus_id}_", "_name")
                metadata['campus_name'] = flat_data.get(campus_name)

            # Extract organization details
            organization_id_key = safe_get_key("organization_", "_id")
            if organization_id_key:
                organization_id = flat_data[organization_id_key]
                metadata['organization_id'] = organization_id

                organization_web_address_key = safe_get_key(f"organization_{organization_id}_", "_web_address")
                metadata['organization_web_address'] = flat_data.get(organization_web_address_key)

                under_category_name_key = safe_get_key(f"organization_{organization_id}_", "_under_category_name")
                metadata['under_category_name'] = flat_data.get(under_category_name_key)

                organization_name_key = safe_get_key(f"organization_{organization_id}_", "_name")
                metadata['organization_name'] = flat_data.get(organization_name_key)

            # Extract common details
            country_name_key = safe_get_key("", "_country_name")
            metadata['country_name'] = flat_data.get(country_name_key)

            country_code_key = safe_get_key("", "_country_code")
            metadata['country_code'] = flat_data.get(country_code_key)

            state_province_name_key = safe_get_key("", "_state_province_name")
            metadata['state_province_name'] = flat_data.get(state_province_name_key)

            city_key = safe_get_key("", "_city")
            metadata['city'] = flat_data.get(city_key)

            return metadata
    

    def extract_clean_text(self,input_text):
        # Remove HTML tags
        soup = BeautifulSoup(input_text, 'html.parser')
        text = soup.get_text(separator="\n")  # Get plain text with newline separators
        
        # Remove Unicode private use area characters
        text = re.sub(r'[\ue200-\ue204]', '', text)
        
        # Clean up any extra whitespace or newlines
        text = re.sub(r'\n+', '\n', text).strip()
        
        return text
    
    def extract_criteria(self, eligibility_text):
        # Initialize the result dictionary with None values
        criteria = {
            "IELTS": "",
            "TOEFL": "",
            "DUOLINGO": "",
            "GRE": "",
            "CGPA": ""
        }
        
        # Patterns to extract each criterion
        patterns = {
            "IELTS": r"IELTS\s+(\d+(\.\d+)?)",
            "TOEFL": r"TOEFL\s+(\d+)",
            "DUOLINGO": r"DUOLINGO\s+(\d+)",
            "GRE": r"GRE\s+(\d+)",
            "CGPA": r"CGPA\s+(\d+(\.\d+)?)"
        }
        
        # Search each pattern in the eligibility text and update criteria if found
        for key, pattern in patterns.items():
            match = re.search(pattern, eligibility_text, re.IGNORECASE)
            if match:
                criteria[key] = float(match.group(1))  # Extracted value
        
        return criteria
    
    def extract_criteria_with_llm(self, eligibility_text):

        client = OpenAI(api_key= os.getenv("OPENAI_API_KEY")) 
        # Initialize the result dictionary with None values
        criteria = {
            "IELTS": "",
            "TOEFL": "",
            "DUOLINGO": "",
            "GRE": "",
            "CGPA": ""
        }
        
        system_message = """
        You are a data extractor. Given a graduate/ undergraduate program requirement description that includes standardized test and minimum scores, along with CGPA requirements. You will look for the standardized tests like IELTS, TOEFL, DUOLINGO, SAT, GRE, LSAT and other tests and minimum CGPA requirements and extract the score. If a score is not found, keep it None
        """



        custom_functions = [{
            "type": "function",
            "function": {
            'name': 'extract_test_scores',
            'strict': True,
            'description':
            'You are an expert data analyst. Based on an open-ended question, you will identify the relevant factors to investigate and generate fields of a dataset with descriptions and explanations for each field.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'fields': {
                        'type': 'array',
                        'description': 'You are a data extractor. Given a graduate/ undergraduate program requirement description that includes standardized test and minimum scores, along with CGPA requirements. You will look for the standardized tests like IELTS, TOEFL, DUOLINGO, SAT, GRE, LSAT and other tests and minimum CGPA requirements and extract the score',
                        'items': {
                            'type': 'object',

                            "properties": {
                                "IELTS": {
                                        "type": "number",
                                        "description": "English proficiency test often required by non-native speakers"
                                    },
                                    "TOEFL": {
                                        "type": "number",
                                        "description": "For non-native English speakers; assesses English proficiency"
                                    },
                                    "SAT": {
                                        "type": "number",
                                        "description": "Scholastic Assessment Test"
                                    },
                                "GRE": {
                                        "type": "number",
                                        "description": "Graduate Record Examination"
                                    },
                                    "GMAT": {
                                        "type": "number",
                                        "description": "Graduate Management Admission Test"
                                    },
                                    "MAT": {
                                        "type": "number",
                                        "description": "Miller Analogies Test"
                                    },
                                "CGPA": {
                                        "type": "number",
                                        "description": "Minimum CGPA required for the program "
                                    },
                                "DUOLINGO": {
                                    "type": "number",
                                    "description": "English proficiency test"
                                },
                                },
                            "required": ["IELTS", "TOEFL", "SAT", "GRE", "GMAT", "MAT", "CGPA", "DUOLINGO"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["fields"],
                "additionalProperties": False,
            }}
        }] 

        response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": eligibility_text}
        ],
        tools=custom_functions,
        tool_choice={"type": "function", "function": {"name": "extract_test_scores"}})

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        extracted_json = {}
        for tool_call in tool_calls:
            # print(f"Function: {tool_call.function.name}")
            # print(f"Params:{tool_call.function.arguments}")

            arguments = json.loads(tool_call.function.arguments)
            # print(arguments['fields'][0])
            # print(type(arguments['fields']))
            extracted_json = arguments['fields'][0]
        
        return extracted_json

    def extract_funding_data(self, data):
            # Initialize empty lists for each funding attribute
            funding_data = {
                "funding_id": [],
                "funding_for": [],
                "funding_type": [],
                "funding_opportunity_for": [],
                "title_of_funding": [],
                "description": []
            }

            # Loop over the data to find funding keys
            for key, value in data.items():
                # print(key)
                # Check for funding_id and add it to the list
                if key.startswith("funding_") and "_id" in key and isinstance(value, int):
                    funding_data["funding_id"].append(value)
                
                # Check for funding_for and add it to the list
                elif key.startswith("funding_") and key.endswith("funding_for") and value is not None:
                    funding_data["funding_for"].append(value)
                
                # Check for funding_type and add it to the list
                elif key.startswith("funding_") and "_funding_type" in key and value is not None:
                    funding_data["funding_type"].append(value)
                
                # Check for funding_opportunity_for and add it to the list
                elif key.startswith("funding_") and "_funding_opportunity_for" in key and value is not None:
                    funding_data["funding_opportunity_for"].append(value)
                
                # Check for title_of_funding and add it to the list
                elif key.startswith("funding_") and "_title_of_funding" in key and value is not None:
                    funding_data["title_of_funding"].append(value)
                
                # Check for funding description (assuming a description field exists)
                elif key.startswith("funding_") and "_description" in key and value is not None:
                    funding_data["description"].append(value)

            return funding_data


    def extract_metadata_program(self, flat_data):
        metadata = {}
 
        # Helper function to safely get keys
        def safe_get_key(prefix, suffix):
            try:
                return next(key for key in flat_data if key.startswith(prefix) and key.endswith(suffix))
            except StopIteration:
                return None
            
        
        # Extract program details
        program_id_key = safe_get_key("program_", "_id")
        if program_id_key:
            program_id = flat_data[program_id_key]
            metadata['program_id'] = program_id

            program_title_key = safe_get_key(f"program_{program_id}_", "_title")
            metadata['program_title'] = flat_data.get(program_title_key)

            program_description_key = safe_get_key(f"program_{program_id}_", "_description")
            metadata['program_description'] = self.extract_clean_text(flat_data.get(program_description_key))

            eligibility_criteria_key = safe_get_key(f"program_{program_id}_", "_eligibility_criteria")
            eligibility_criteria_dict = self.extract_criteria_with_llm(self.extract_clean_text(flat_data.get(eligibility_criteria_key)))
            metadata.update(eligibility_criteria_dict)
            

            application_process_key = safe_get_key(f"program_{program_id}_", "_application_process")
            metadata['application_process'] = flat_data.get(application_process_key)

            application_fee_key = safe_get_key(f"program_{program_id}_", "_application_fee")
            metadata['application_fee'] = float(flat_data.get(application_fee_key))

            application_end_date_key = safe_get_key(f"program_{program_id}_", "_application_end_date")
            date_string = flat_data.get(application_end_date_key)
            # convert in timestamp
            timestamp = int(time.mktime(datetime.strptime(date_string, "%Y-%m-%d").timetuple()))
            metadata['application_end_date'] =  timestamp

       
            

        # Extract department details
        department_id_key = safe_get_key("department_", "_id")
        if department_id_key:
            department_id = flat_data[department_id_key]
            metadata['department_id'] = department_id

            department_name_key = safe_get_key(f"department_{department_id}_", "_name")
            metadata['department_name'] = flat_data.get(department_name_key)

        # Extract college details
        college_id_key = safe_get_key("college_", "_id")
        if college_id_key:
            college_id = flat_data[college_id_key]
            metadata['college_id'] = college_id

            college_name_key = safe_get_key(f"college_{college_id}_", "_name")
            metadata['college_name'] = flat_data.get(college_name_key)

        # Extract campus details
        campus_id_key = safe_get_key("campus_", "_id")
        if campus_id_key:
            campus_id = flat_data[campus_id_key]
            metadata['campus_id'] = campus_id

            campus_name_key = safe_get_key(f"campus_{campus_id}_", "_name")
            metadata['campus_name'] = flat_data.get(campus_name_key)

        # Extract organization details
        organization_id_key = safe_get_key("organization_", "_id")
        if organization_id_key:
            organization_id = flat_data[organization_id_key]
            metadata['organization_id'] = organization_id

            organization_name_key = safe_get_key(f"organization_{organization_id}_", "_name")
            metadata['organization_name'] = flat_data.get(organization_name_key)

        # Extract common details
        country_name_key = safe_get_key("", "_country_name")
        metadata['country_name'] = flat_data.get(country_name_key)

        country_code_key = safe_get_key("", "_country_code")
        metadata['country_code'] = flat_data.get(country_code_key)

        state_province_name_key = safe_get_key("", "_state_province_name")
        metadata['state_province_name'] = flat_data.get(state_province_name_key)

        city_key = safe_get_key("", "_city")
        metadata['city'] = flat_data.get(city_key)

        return metadata


    


# if __name__ == '__main__':
#     model_name = "mixedbread-ai/mxbai-embed-large-v1"
#     output_path = "chromadb_data/user_details_mxbai_embed_cosine"

#     embedding_function = SentenceTransformerEmbeddingFunction(model_name=model_name)
#     ingestor = DjangoToChromaDBIngest(embedding_function, output_path=output_path)
#     ingestor.ingest_user_documents()
