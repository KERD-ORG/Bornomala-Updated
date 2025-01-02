import requests

BASE_URL = "http://127.0.0.1:8000/api"
TOKEN = "7d7679763a3b3a5052e85e64cf684c2b11629e47"

HEADERS = {
    "Authorization": f"Token {TOKEN}",
    "Content-Type": "application/json"
}

def send_request(method, endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    response = requests.request(method, url, headers=HEADERS, json=data)
    print(f"Response for {method} {url}:")
    print(f"Status Code: {response.status_code}")
    try:
        print(response.json())
    except Exception:
        print("Response is not JSON.")
    print("\n")
    return response

# 1. Create a new category
send_request("POST", "/categories/", {
    "name": "Universities",
    "description": "All public and private universities"
})

# 2. Create a new organization
send_request("POST", "/organizations/", {
    "name": "Dhaka University",
    "under_category": 1,
    "web_address": "https://du.ac.bd",
    "statement": "Top public university in Bangladesh",
    "document": None,
    "status": True,
    "address_line1": "Administrative Office",
    "address_line2": "Nilkhet Rd",
    "division": 1,
    "district": "Dhaka",
    "postal_code": "1000",
    "first_name": "Registrar",
    "middle_name": "",
    "last_name": "",
    "email": "info@du.ac.bd"
})

# 3. Create a new question level
send_request("POST", "/question-levels/", {
    "name": "Beginner Level"
})

# 4. Create a difficulty level
send_request("POST", "/difficulty-levels/", {
    "name": "Medium Difficulty"
})

# 5. Create a question status
send_request("POST", "/question-statuses/", {
    "name": "Approved"
})

# 6. Create a question type
send_request("POST", "/question-types/", {
    "name": "Multiple Choice"
})

# 7. Create a group
send_request("POST", "/target-groups/", {
    "name": "Sample Group"
})

# 8. Create a subject
send_request("POST", "/subjects/", {
    "name": "General Knowledge"
})

# 9. Create a topic
send_request("POST", "/topics/", {
    "name": "Geography"
})

# 10. Create a sub-topic
send_request("POST", "/subtopics/", {
    "name": "Asian Countries",
    "topic": 1
})

# 11. Create exam references
send_request("POST", "/exam-references/", {
    "reference_name": "Reference One"
})

send_request("POST", "/exam-references/", {
    "reference_name": "Reference Two"
})

# 12. Create a question
send_request("POST", "/questions/", {
    "question_text": "What is the capital of Bangladesh?",
    "explanation": "The capital is Dhaka.",
    "correct_answer": "Dhaka",
    "question_level": 1,
    "target_organization": 1,
    "target_group": 1,
    "target_subject": 1,
    "question_type": 1,
    "topic": 1,
    "sub_topic": 1,
    "sub_sub_topic": None,
    "exam_references": [1, 2],
    "question_status": 1,
    "difficulty_level": 1
})