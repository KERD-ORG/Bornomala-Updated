from dotenv import load_dotenv, find_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain.output_parsers import StructuredOutputParser, ResponseSchema

import os
import openai
import sys
import json
import glob
import tiktoken

import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from PyPDF2 import PdfReader

from response_schemas import ResponseSchemaParser

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


class TextExtractor:
    @staticmethod
    def num_tokens_from_string(string: str, encoding_name: str) -> int:
        encoding = tiktoken.encoding_for_model(encoding_name)
        num_tokens = len(encoding.encode(string))
        return num_tokens

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
            text = TextExtractor.extract_text_from_pdf(file_path)
            if not text.strip():
                text = TextExtractor.extract_text_using_ocr(file_path)
        elif file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif')):
            text = TextExtractor.extract_text_from_image(file_path)
        elif file_path.lower().endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        else:
            raise ValueError("Unsupported file type. Only PDF and image files are supported.")
        return text


class DataExtractor:
    def __init__(self, model_name="gpt-4o", temperature=0):
        self.model = ChatOpenAI(model_name=model_name, temperature=temperature)

    def extract_funding_data(self, output_filepath, file_path):
        text = TextExtractor.get_text_from_file(file_path)
        print("TEXT:")
        print(text)

        response_schemas = ResponseSchemaParser.funding_response_schemas
        output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

        template = """query: : {query}.
        Here is the input text: {text}. 

        {format_instructions}

        Do not use external information. Write your answer in JSON. keep the value of the keys none if the information is not present in the database.
        Answer: """
        format_instructions = output_parser.get_format_instructions()
        prompt = PromptTemplate(
            template=template,
            input_variables=["query"],
            partial_variables={"format_instructions": format_instructions}
        )

        query = "Extract all these entity information from the input text."
        chain = prompt | self.model | output_parser

        answer = chain.invoke({"query": query, "text": text})

        print("Answer:")
        print(answer)
        return answer

    def extract_applicant_data(self, file_path, document_type="resume"):
        text = TextExtractor.get_text_from_file(file_path)
        print("TEXT:")
        print(text)

        if document_type == "resume":
            response_schema = ResponseSchemaParser.cv_response_schemas
        elif document_type == "sop":
            response_schema = ResponseSchemaParser.sop_response_schemas

        output_parser = StructuredOutputParser.from_response_schemas(response_schema)

        template = """query: : {query}.
        Here is the input text: {text}. 

        {format_instructions}

        Do not use external information. Write your answer in JSON. keep the value of the keys none if the information is not present in the database.
        Answer: """
        format_instructions = output_parser.get_format_instructions()
        prompt = PromptTemplate(
            template=template,
            input_variables=["query"],
            partial_variables={"format_instructions": format_instructions}
        )

        query = "Extract all these entity information from the input text."
        chain = prompt | self.model | output_parser

        answer = chain.invoke({"query": query, "text": text})

        print("Answer:")
        print(answer)
        return answer


if __name__ == '__main__':
    data_extractor = DataExtractor()
    resume = "resume_hafija.pdf"
    data_extractor.extract_applicant_data(resume)
