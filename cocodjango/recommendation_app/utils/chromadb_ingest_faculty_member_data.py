from django.core.management.base import BaseCommand
from sentence_transformers import SentenceTransformer
import chromadb
import os
from .text_loader_from_file import TextLoader
from django.conf import settings
# from ..utils import UserDataService
from common.models import SoftDeleteModel
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from profile_app.models import UserDetails
from faculty_members_app.models import FacultyMembers
from services.user_data_service import UserDataService
from services.faculty_data_service import FacultyDataService


class Command(BaseCommand):
    help = 'Ingest data from Django models into ChromaDB'

    def handle(self, *args, **kwargs):
        # The code inside your __main__ block
        model_name = "mixedbread-ai/mxbai-embed-large-v1"
        output_path = "chromadb_data/faculty_members_mxbai_embed_cosine"

        embedding_function = SentenceTransformerEmbeddingFunction(model_name=model_name)
        ingestor = DjangoToChromaDBIngest(embedding_function, output_path=output_path)
        # ingestor.ingest_user_documents()
        ingestor.ingest_faculty_documents()



class DjangoToChromaDBIngest:
    def __init__(self, embedding_function, output_path=None):
        self.embedding_function = embedding_function
        if output_path:
            if not os.path.exists(output_path):
                os.makedirs(output_path)
        self.output_path = output_path

    def get_embedding(self, text):
        return self.embedding_function.encode(text).tolist()

    def ingest_user_documents(self):
        users = UserDetails.objects.all()
        
        # client = chromadb.PersistentClient(path=self.output_path)
        # try:
        #     client.delete_collection(name="user_documents")
        # except Exception as e:
        #     print("Collection doesn't exist or failed to delete:", e)
        
        # collection = client.create_collection(name="user_documents", metadata={"hnsw:space": "cosine"})
        
        for user in users:
            user_id = user.user.id
            sop_path = user.sop.path
            resume_path = user.resume.path
            
            print("Paths:")
            print(sop_path)
            print(resume_path)

            sop_text = TextLoader.get_text_from_file(sop_path)
            resume_text = TextLoader.get_text_from_file(resume_path)
            
            # Get flat user data
            user_data_service = UserDataService(user.user)
            flat_data = user_data_service.get_flat_user_data()

            print("Flat data:") 
            print(flat_data)
            # Insert embeddings into ChromaDB with metadata
            embedding_id = f"user_{user_id}"
            metadata = flat_data
            
            print(metadata)
            print(sop_text[:20])
            print(resume_text[:20])
            
            # collection.add(
            #     documents=[sop_text + " " + resume_text],
            #     metadatas=[metadata],
            #     ids=[embedding_id]
            # )
    def ingest_faculty_documents(self):
        faculty_members = FacultyMembers.objects.all()
        
        # client = chromadb.PersistentClient(path=self.output_path)
        # try:
        #     client.delete_collection(name="faculty_documents")
        # except Exception as e:
        #     print("Collection doesn't exist or failed to delete:", e)
        
        # collection = client.create_collection(name="faculty_documents", metadata={"hnsw:space": "cosine"})
        
        for faculty_member in faculty_members:
            faculty_data_service = FacultyDataService(faculty_member.user.id)
            flat_data = faculty_data_service.get_flat_faculty_data()

            embedding_id = f"faculty_{faculty_member.id}"
            metadata = flat_data
            print(metadata)

            # collection.add(
            #     documents=[""],  # Assuming you have some document text or embedding
            #     metadatas=[metadata],
            #     ids=[embedding_id]
            # )

if __name__ == '__main__':
    model_name = "mixedbread-ai/mxbai-embed-large-v1"
    output_path = "chromadb_data/user_details_mxbai_embed_cosine"

    embedding_function = SentenceTransformerEmbeddingFunction(model_name=model_name)
    ingestor = DjangoToChromaDBIngest(embedding_function, output_path=output_path)
    ingestor.ingest_user_documents()
