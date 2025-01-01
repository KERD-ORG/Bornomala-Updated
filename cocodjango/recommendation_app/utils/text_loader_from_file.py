import tiktoken
import os
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from PyPDF2 import PdfReader
from django.conf import settings


class TextLoader:
    @staticmethod
    # def num_tokens_from_string(string: str, encoding_name: str) -> int:
    #     encoding = tiktoken.encoding_for_model(encoding_name)
    #     num_tokens = len(encoding.encode(string))
    #     return num_tokens

    @staticmethod
    def extract_text_from_pdf(file_path):
        try:
            pdf_reader = PdfReader(file_path)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return None

    @staticmethod
    def extract_text_from_image(file_path):
        image = Image.open(file_path)
        return pytesseract.image_to_string(image)

    @staticmethod
    def extract_text_using_ocr(file_path):
        doc = fitz.open(file_path)
        text = ""
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text("text")
        return text

    @staticmethod
    def get_text_from_file(file_path):
        text = ""
       
        
        if file_path.lower().endswith('.pdf'):
            # print(file_path)
            text = TextLoader.extract_text_from_pdf(file_path)
            if not text.strip():
                text = TextLoader.extract_text_using_ocr(file_path)
        elif file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif')):
            text = TextLoader.extract_text_from_image(file_path)
        elif file_path.lower().endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        else:
            raise ValueError("Unsupported file type. Only PDF and image files are supported.")
        return text
