from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
# from .user_data_service import UserDataService
from .utils.chromadb_ingest_user_data import DjangoToChromaDBIngest
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status
from .models import  Funding
from college_app.models import College
from django.conf import settings
import chromadb
import time
from datetime import datetime
import os
from django.contrib.auth.models import User
from services.user_data_service import UserDataService
from services.faculty_data_service import FacultyDataService
from services.college_data_service import CollegeDataService
from django.contrib.auth.decorators import login_required
from utils import (
    delete_uploaded_files,
    upload_file,
    log_request,
    get_response_template
)
from django.utils.translation import gettext_lazy
from django.utils.translation import gettext_lazy as _


class EmbedUserDataView(APIView):
    
    def get(self, request):
        model_name = "mixedbread-ai/mxbai-embed-large-v1"
        researcher_user_output_path = "chromadb_data/researcher_users_details_mxbai_embed_cosine"
        student_user_output_path = "chromadb_data/student_users_details_mxbai_embed_cosine"
        # faculty_output_path = "chromadb_data/faculty_funding_details_mxbai_embed_cosine"
        college_output_path = "chromadb_data/college_details_mxbai_embed_cosine"
        dept_output_path = "chromadb_data/dept_details_mxbai_embed_cosine"
        program_output_path = "chromadb_data/program_details_mxbai_embed_cosine"

        embedding_function = SentenceTransformerEmbeddingFunction(model_name=model_name)
        researcher_user_ingestor = DjangoToChromaDBIngest(embedding_function, output_path=researcher_user_output_path)
        student_user_ingestor = DjangoToChromaDBIngest(embedding_function, output_path=student_user_output_path)
        # faculty_ingestor = DjangoToChromaDBIngest(embedding_function, output_path=faculty_output_path)
        # college_ingestor = DjangoToChromaDBIngest(embedding_function, output_path=college_output_path)
        # dept_ingestor = DjangoToChromaDBIngest(embedding_function, output_path=dept_output_path)
        program_ingestor = DjangoToChromaDBIngest(embedding_function, output_path=program_output_path)
        
        try: 
            researcher_user_ingestor.ingest_researcher_user_documents()
            student_user_ingestor.ingest_student_user_documents()
            # faculty_ingestor.ingest_faculty_documents()
            # college_ingestor.ingest_college_documents()
            # dept_ingestor.ingest_dept_documents()
            program_ingestor.ingest_program_documents()
            return JsonResponse({'status': 'success', 'message': 'User data embedding done.'})
        except Exception as e:
            print(str(e))
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# def get_user_list(request):
#     users = list(User.objects.values('id', 'name'))
#     return JsonResponse({'users': users})

def recommend_programs(user, top_n=10, filters={}):
    client_student = chromadb.PersistentClient(path=os.path.join(settings.BASE_DIR, 'chromadb_data/student_users_details_mxbai_embed_cosine'))
    client_program = chromadb.PersistentClient(path=os.path.join(settings.BASE_DIR, 'chromadb_data/program_details_mxbai_embed_cosine'))
    
    student_user_collection = client_student.get_collection(name="student_user_documents")
    program_collection = client_program.get_collection(name="program_documents")

    # Retrieve the embedding for the student user
    embedding_id = f"{user.id}"
    user_embedding_record = student_user_collection.get(embedding_id, include=['embeddings', 'documents', 'metadatas'])
    user_embedding = user_embedding_record['embeddings'][0]

    # Build the query filter based on the student's scores and additional filters
    query_filter = {"$and": []}
    
    # Academic filters based on test scores and CGPA
    if filters.get('CGPA'):
    # if cgpa is not None:
        query_filter["$and"].append({
            "$or": [
                {"CGPA": {"$lte": float(filters['CGPA'])}},  # Program requires less than or equal to student's CGPA
                {"CGPA": ""}  # Program doesn't have CGPA requirement
            ]
        })
    
    if filters.get('IELTS'):
    # if ielts_score is not None:
        query_filter["$and"].append({
            "$or": [
                {"IELTS": {"$lte": float(filters['IELTS'])}},
                {"IELTS": ""}
            ]
        })
    
    if filters.get('TOEFL'):
    # if toefl_score is not None:
        query_filter["$and"].append({
            "$or": [
                {"TOEFL": {"$lte": float(filters['TOEFL'])}},
                {"TOEFL": ""}
            ]
        })
    
    if filters.get('GRE'):
    # if gre_score is not None:
        query_filter["$and"].append({
            "$or": [
                {"GRE": {"$lte": float(filters['GRE'])}},
                {"GRE": ""}
            ]
        })
    
   
    if filters.get('DUOLINGO'):
    # if gre_score is not None:
        query_filter["$and"].append({
            "$or": [
                {"DUOLINGO": {"$lte": float(filters['DUOLINGO'])}},
                {"DUOLINGO": ""}
            ]
        })
    if filters.get('application_fee'):
    # if gre_score is not None:
        query_filter["$and"].append({
            "$or": [
                {"application_fee": {"$lte": float(filters['application_fee'])}},
                {"application_fee": ""}
            ]
        })

    if filters.get('application_end_date'):
        date_string = filters['application_end_date']
        timestamp = int(time.mktime(datetime.strptime(date_string, "%Y-%m-%d").timetuple()))
    # if gre_score is not None: 
        query_filter["$and"].append({
            "$or": [
                {"application_end_date": {"$gt": timestamp}},
                {"application_end_date": ""}
            ]
        })
    
    # Additional filters based on user preferences
    filter_mappings = {
        'organization_name': 'organization_name',
        'department_name': 'department_name',
        'college_name': 'college_name',
        'country_name': 'country_name',
        'state_province_name': 'state_province_name',
        'city': 'city',
        "funding_available":"funding_available",
        # "application_fee": "application_fee",
        # "application_end_date": "application_end_date"

    }
    
    # Add exact match filters
    for user_filter, db_field in filter_mappings.items():
        if filters.get(user_filter):
            if isinstance(filters[user_filter], list):
                # Handle multiple values for a filter using $or
                query_filter["$and"].append({
                    "$or": [{db_field:   {"$eq": value}} for value in filters[user_filter]]
                })
            else:
                # Handle single value filters
                query_filter["$and"].append({db_field:  {"$eq": filters[user_filter]}})
    
    
    # Handle funding type filters if present
    # if filters.get('funding_type'):
    #     funding_conditions = []
    #     for funding_type in filters['funding_type']:
    #         funding_conditions.append({"funding_type": {"$eq": funding_type}})
    #     if funding_conditions:
    #         query_filter["$and"].append({"$or": funding_conditions})
    
    # Handle funding opportunity filters if present
    # if filters.get('funding_opportunity_for'):
    #     opportunity_conditions = []
    #     for opportunity in filters['funding_opportunity_for']:
    #         opportunity_conditions.append({"funding_opportunity_for": {"$eq": opportunity}})
    #     if opportunity_conditions:
    #         query_filter["$and"].append({"$or": opportunity_conditions})
    
 
    
    # If no filters are provided, remove the '$and' key
    if len(query_filter['$and']) == 0:
        query_filter = {}
    elif len(query_filter['$and']) == 1:
        query_filter = query_filter['$and'][0]

    print("query_filter: ")
    print(query_filter)

    # Query the vector database with the student's embedding and filters
    results = program_collection.query(
        query_embeddings=[user_embedding],
        n_results=top_n,
        where=query_filter
    )

    recommended_programs = []

    # Process the results and structure the recommended programs
    for idx, program_id in enumerate(results['ids'][0]):
        program_info = {
            'program_id': program_id,
            'program_title': results['metadatas'][0][idx]['program_title'],
            'organization_name': results['metadatas'][0][idx].get('organization_name', ""),
            'department_name': results['metadatas'][0][idx].get('department_name', ""),
            'college_name': results['metadatas'][0][idx].get('college_name', ""),
            'country_name': results['metadatas'][0][idx].get('country_name', ""),
            'state_province_name': results['metadatas'][0][idx].get('state_province_name', ""),
            'city': results['metadatas'][0][idx].get('city', ""),
            'IELTS': results['metadatas'][0][idx].get('IELTS', ""),
            'TOEFL': results['metadatas'][0][idx].get('TOEFL', ""),
            'DUOLINGO': results['metadatas'][0][idx].get('GRE', ""),
            'GRE': results['metadatas'][0][idx].get('TOEFL', ""),
            'CGPA': results['metadatas'][0][idx].get('CGPA', ""),
            'funding_available': results['metadatas'][0][idx].get('funding_available', False),
            'application_fee': results['metadatas'][0][idx].get('application_fee', ""),
            'application_end_date': datetime.fromtimestamp(results['metadatas'][0][idx].get('application_end_date', "")).strftime('%Y-%m-%d'),
            'distance': results['distances'][0][idx]  # Similarity distance score
        }
        recommended_programs.append(program_info)
    print("recommended_programs: ", recommended_programs)
    
    return user, user_embedding_record['documents'][0], recommended_programs

def recommend_researchers(user, top_n=10, filters={}):
    # Initialize the clients for accessing vector database collections
    client_student = chromadb.PersistentClient(path=os.path.join(settings.BASE_DIR, 'chromadb_data/student_users_details_mxbai_embed_cosine'))
    client_researcher = chromadb.PersistentClient(path=os.path.join(settings.BASE_DIR, 'chromadb_data/researcher_users_details_mxbai_embed_cosine'))

    # Load the student and researcher collections
    student_user_collection = client_student.get_collection(name="student_user_documents")
    researcher_collection = client_researcher.get_collection(name="researcher_user_documents")

    # Retrieve the embedding for the student user
    embedding_id = f"{user.id}"
    user_embedding_record = student_user_collection.get(embedding_id, include=['embeddings', 'documents', 'metadatas'])
    user_embedding = user_embedding_record['embeddings'][0]

    # print("researcher record: ")
    # print(researcher_collection) 

    # Build the query filter based on user-defined criteria
    query_filter = {"$and": []}
 
    # Add filters for specific fields if provided
    filter_mappings = {
        'organization_name': 'organization_name',
        'department_name': 'department_name',
        'college_name': 'college_name',
        'city': 'city',
        'funding_available': 'funding_available',
        'funding_type': 'funding_type',
        'funding_opportunity_for': 'funding_opportunity_for',
    }

    # Apply filters based on provided fields in filters dictionary
    for user_filter, db_field in filter_mappings.items():
        if filters.get(user_filter):
            if isinstance(filters[user_filter], list):
                # Handle multiple values for a filter using $or
                query_filter["$and"].append({
                    "$or": [{db_field: {"$eq": value}} for value in filters[user_filter]]
                })
            else:
                # Handle single value filters
                query_filter["$and"].append({db_field: {"$eq": filters[user_filter]}})

    # Remove '$and' if no filters are added to it
    if len(query_filter['$and']) == 0:
        query_filter = {}
    elif len(query_filter['$and']) == 1:
        query_filter = query_filter['$and'][0]

    print("filter query: ", query_filter)
    # result1 = researcher_collection.query(
    #     query_texts=["machine learning"],
    #     n_results=top_n,
    #     # where=query_filter
    # )
    # print(result1)
    # Query the researcher collection using student's embedding and filters
    print("querying...")
    results = researcher_collection.query(
        query_embeddings=[user_embedding],
        n_results=top_n,
        where=query_filter
    ) 

    # print("results: , ", results) 
 
    recommended_researchers = []

    # Process and structure the recommendations based on the query results
    for idx, researcher_id in enumerate(results['ids'][0]):
        researcher_info = {
            'user_id': researcher_id,
            'name': results['metadatas'][0][idx].get('name', ""),
            'type': results['metadatas'][0][idx].get('type', ""),
            'organization_name': results['metadatas'][0][idx].get('organization_name', ""),
            'department_name': results['metadatas'][0][idx].get('department_name', ""),
            'college_name': results['metadatas'][0][idx].get('college_name', ""),
            'city': results['metadatas'][0][idx].get('city', ""),
            'funding_available': results['metadatas'][0][idx].get('funding_available', False),
            'funding_type': results['metadatas'][0][idx].get('funding_type', ""),
            'funding_opportunity_for': results['metadatas'][0][idx].get('funding_opportunity_for', ""),
            'distance': results['distances'][0][idx]  # Similarity distance score
        }
        recommended_researchers.append(researcher_info)

    print("recommended_researchers: ", recommended_researchers)

    return user, user_embedding_record['documents'][0], recommended_researchers



# def recommend_universities(user, filters, top_n=10):
#     client_user = chromadb.PersistentClient(path=os.path.join(settings.BASE_DIR, 'chromadb_data/student_users_details_mxbai_embed_cosine'))
#     client_college = chromadb.PersistentClient(path=os.path.join(settings.BASE_DIR, 'chromadb_data/college_details_mxbai_embed_cosine'))
#     college_collection = client_college.get_collection(name="college_documents")
#     user_collection = client_user.get_collection(name="student_user_documents")
    
#     query_filter = {"$and": []}

#     if filters.get('under_category_name'):
#         query_filter["$and"].append({"under_category_name": filters['under_category_name']})
#     if filters.get('country_name'):
#         query_filter["$and"].append({"country_name": filters['country_name']})
#     if filters.get('organization_name'):
#         query_filter["$and"].append({"organization_name": filters['organization_name']})
#     if filters.get('department_name'):
#         query_filter["$and"].append({"department_name": filters['department_name']})

#     print(filters)
#     # print(len(filters))
#     if len({k: v for k, v in filters.items() if v != ''}) == 1:
#         query_filter = {}
#         query_filter = {k: v for k, v in filters.items()  if v != ''}
#     elif (len({k: v for k, v in filters.items() if v != '' }) == 0) or len({k: v for k, v in filters.items() if v != None}) == 0:
#         query_filter = {} 


#     embedding_id = f"{user.id}"
#     # print("embedding id:", embedding_id)
#     user_embedding_record = user_collection.get(embedding_id, include=['embeddings', 'documents', 'metadatas'])
#     # print("embedding record: ")
#     # print(user_embedding_record)
#     user_embedding = user_embedding_record['embeddings'][0]
#     # print("query: ", user_embedding)
#     # print(query_filter)
#     if len(query_filter) > 0:

#         results = college_collection.query(
#             query_embeddings=[user_embedding], 
#             n_results=top_n,
#             where=query_filter
#         )

#     else:
#         results = college_collection.query(
#             query_embeddings=[user_embedding], 
#             n_results=top_n,
#         )
 
#     # print(results)

#     recommended_unis = []
#     for idx, college_id in enumerate(results['ids'][0]):
#         college_id = college_id.split('_')[1]
#         # college = College.objects.get(id=college_id)
#         college_info = {
#             'university': results['metadatas'][0][idx]['organization_name'],
#             'college_name': results['metadatas'][0][idx]['college_name'],
#             'campus_name': results['metadatas'][0][idx]['campus_name'],
#             'minimum_cgpa': 3.45,
#             'required_ielts_score': 8,
#         }
#         # print(college_info) 
#         recommended_unis.append(college_info)
    
#     return recommended_unis

class RecommendUniversitiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            response_data = get_response_template()
            user = request.user
            search_type = request.GET.get('search_type', 'professors')  # Default to 'professors'
            funding_available = request.GET.get('scholarshipAvailability')
            if funding_available == "null":
                funding_available = None
            
            if search_type == 'universities':
                
             
                filters = {
                    # 'under_category_name': request.GET.get('under_category_name'),
                    'country_name': request.GET.get('country_name'),
                    'organization_name': request.GET.get('organization_name'),
                    # "application_deadline": request.GET.get('applicationDeadline'),
                   
                    "IELTS": request.GET.get('ielts_score'),
                    "CGPA": request.GET.get('cgpa'),
                    "funding_available": funding_available,
                    "application_end_date": request.GET.get('applicationDeadline'),
                    "state_province_name": request.GET.get('state_province_name'),
                    "department_name": request.GET.get('department_name'),
                    "college_name": request.GET.get('college_name'),
                    "TOEFL": request.GET.get('TOEFL'),
                    "DUOLINGO": request.GET.get('DUOLINGO'),
                    "GRE": request.GET.get('GRE'),
                    "application_fee": request.GET.get('application_fee'),
                
 
                }
                # print("filter from frontend: ",filters )
                # recommended_unis = recommend_universities(user, filters)
                _, _, recommended_unis = recommend_programs(user, filters=filters)
                user_data = {}  # No user data needed for university search
                sop_text = ""
                resume_text = ""
            else:
                filters = {
                    # 'under_category_name': request.GET.get('under_category_name'),
                    'country_name': request.GET.get('country_name'),
                    'organization_name': request.GET.get('organization_name'),
                    # "application_deadline": request.GET.get('applicationDeadline'),
                   
                    
                    "funding_available": funding_available,
                 
                    
                    "department_name": request.GET.get('department_name'),
                    # "college_name": request.GET.get('college_name'),
                   
                
 
                }
                print("professor search")
                print("filter from frontend: ",filters )
                
                user, user_documents, recommended_unis = recommend_researchers(user, filters=filters)
                
                middle_index = len(user_documents) // 2
                resume_text = user_documents[:middle_index]
                sop_text = user_documents[middle_index:]
            

            data = {
                'user': {
                    'id': user.id,
                    'name': user.first_name + ' ' + user.last_name, 
                } if search_type == 'professors' else None,
                'sop_text': sop_text,
                'resume_text': resume_text,
                'universities': recommended_unis
            }
            response_data.update({
                    'status': 'success',
                    'message': 'Recommendations retrieved successfully.',
                    'data': data,
                })
            # print("response_data: ")
            # print(response_data)
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            response_data = get_response_template()
            response_data.update({
                'status': 'error',
                'message': gettext_lazy('Validation error occurred.'),
                'error_code': 'VALIDATION_ERROR',
                'details': str(e)
            })
            print(str(e))
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
        # return Response({ 
        #     'user': {
        #         'id': user.id,
        #         'name': user.first_name + ' ' + user.last_name,
        #         'ielts_score': user_data.get('ielts_score') if search_type == 'professors' else None,
        #     } if search_type == 'professors' else None,
        #     'sop_text': sop_text,
        #     'resume_text': resume_text,
        #     'universities': recommended_unis
        # }, status=status.HTTP_200_OK)