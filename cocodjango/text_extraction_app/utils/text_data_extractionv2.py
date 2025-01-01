import os
import openai
import json
import tiktoken
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from PyPDF2 import PdfReader
from openai import OpenAI

load_dotenv()
# openai.api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key= os.getenv("OPENAI_API_KEY"))  # Replace with your actual API key

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
        self.model_name = model_name
        self.temperature = temperature
    @staticmethod
    def load_json_structure(json_file_path):
        # Load JSON structure from a file
        with open(json_file_path, 'r') as file:
            return json.load(file)

    @staticmethod
    def convert_json_to_tools(json_data):
        system_message = """
        You are a data extraction tool. You will be given fields with descriptions and explanations, and your task is to extract the relevant data from a given resume or CV text for each field. If no data is found, set its value to None.
        """

        tools = [{
            "type": "function",
            "function": {
                'name': 'data_extraction_tool',
                'strict': True,
                'description':
                'You are a data extraction tool. You will be given fields with descriptions and explanations, and your task is to extract the relevant data from a given resume or CV text for each field. If a date is found, write it in mm-dd-yyyy format. If no day or month is found, set it to the first. Test score value should be a number, no text should be there. If no data is found for a field, input empty string for that field',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'extracted_data': {
                            'type': 'array',
                            'description': 'You will list the dictionary of extracted data for the fields, each defaulting to None if not found.',
                            'items': {
                                'type': 'object',
                                "properties": {},
                                "required": [],
                                "additionalProperties": False,
                              },
                        },
                    },
                    "required": ["extracted_data"],
                    "additionalProperties": False,
                }
            }
        }]

        # Populate the properties and required fields based on the JSON structure
        for key, value in json_data.items():
            if isinstance(value, list) and isinstance(value[0], dict):
                item_properties = {}
                required_fields = []
                for sub_key in value[0]:
                    item_properties[sub_key] = {
                        "type": "string",
                        "description": f"Extract relevant data for the field: {sub_key} in {key} from the resume. If not found, set to None."
                    }
                    required_fields.append(sub_key)

                tools[0]['function']['parameters']['properties']['extracted_data']['items']['properties'][key] = {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": item_properties,
                        "required": required_fields,
                        "additionalProperties": False,
                    },
                    "description": f"Extract a list of {key} with the following fields: {', '.join(required_fields)} from the resume. If not found, set to None."
                }
                tools[0]['function']['parameters']['properties']['extracted_data']['items']['required'].append(key)
            else:
                tools[0]['function']['parameters']['properties']['extracted_data']['items']['properties'][key] = {
                    "type": "string",
                    "description": f"Extract relevant data for the field: {key} from the resume. If not found, set to None."
                }
                tools[0]['function']['parameters']['properties']['extracted_data']['items']['required'].append(key)

        return system_message, tools

    def extract_applicant_data(self, resume_file_path, json_file_path):
        text = TextExtractor.get_text_from_file(resume_file_path)
        print("TEXT:")
        print(text)

        # Load the JSON structure from a file
        json_structure = self.load_json_structure(json_file_path)

        # Convert the JSON structure into tools for data extraction
        system_message, tools = self.convert_json_to_tools(json_structure)

       
        response = client.chat.completions.create(
            model=self.model_name,
            temperature=self.temperature,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": text}
            ],
            tools=tools,
            tool_choice={"type": "function", "function": {"name": "data_extraction_tool"}}
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        generated_fields = []
        for tool_call in tool_calls:
            arguments = json.loads(tool_call.function.arguments)
            generated_fields.append(arguments)

        answer = generated_fields[0]  # final output
        print("Answer:")
        print(answer)
        return answer


if __name__ == '__main__':
    data_extractor = DataExtractor()
    resume = "/Users/saki3064/Library/CloudStorage/OneDrive-UniversityofIdaho/Academic/PhD/summer_project/text_entity_extraction/data/resume/resume_hafija.pdf"
    json_file = "cv_json_schema.json"  # Specify your JSON file path here
    data_extractor.extract_applicant_data(resume, json_file)