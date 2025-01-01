from langchain.output_parsers import StructuredOutputParser, ResponseSchema

class ResponseSchemaParser:
    # Funding data
    funding_response_schemas = [
        ResponseSchema(name="university_name", description="Mention the name of the university for which the post is created. Do not use any other words. Just mention the university name. Keep it blank if you did not find the expected output."),
        ResponseSchema(name="professor_name", description="Mention the name of the professor who is looking for students for this job. Do not use any other words. Keep it blank if you did not find the expected output."),
        ResponseSchema(name="required_english_proficiency_score", description="It will contain the required english proficiency score (IELTS, TOEFL or DUOLINGO). Just get the exact score. It will be just numbers. IELTS score will be between 1 to 9 and may contain decimal. TOEFL score will be between 1 to 120. DUOLINGO score will be between 10 to 160. Keep it blank if you did not find the expected output."),
        
        ResponseSchema(name="required_GRE_score", description="It will contain the required minimum GRE score. Just get the exact minimum score if it is mentioned. It will be just numbers. Keep it blank if you did not find the expected output."),
        ResponseSchema(name="intended_program", description="It will contain the department name for the recruitment. Example: Computer Science, Data Science, Psychology etc. Keep it blank if you did not find the expected output."),
        ResponseSchema(name="intended_degree", description="It will contain the degree name. It will define what type of student the recruiter is planning to hire. It can be Undergraduated, Master or PhD. Keep it blank if you did not find the expected output."),
        # ResponseSchema(name="scholarship_preference", description="Answer if the user is looking for full scholarship, partial scholarships or no scholarships/ Self fund. Scholarship can be also addressed as funding. Only have one of these values: full, partial, self"),
        ResponseSchema(name="required_skills", description="It will contain comma separated required skill names to be qualified for the job. For example, the user can have these skills: python, c++, javascript, machine learning etc. Keep it blank if you did not find the expected output."),
        # ResponseSchema(name="publications", description="Mention if the user has any publications or research experience. For example, the user can have 3 conference papers or 2 journal articles."),
        ResponseSchema(name="research_field", description="Mention the research field of the recruiter or the job. If the fields are multiple, put it in a comma separated format. For example, the user's research fields are : machine learning in chemical engineering, cyber security in credit card fraud. Keep it blank if you did not find the expected output."),
        ResponseSchema(name="application_deadline", description="Type: Date field. Write the deadline to apply for the application. Leave blank if you do not find the deadline."),
        ResponseSchema(name="application_session", description="Type: string. Write the deadline session for the application. It can be among summer, fall and spring. Leave blank if you do not find the deadline."),
        ResponseSchema(name="application_year", description="Type: number. Write the deadline year for the application. It can be among summer, fall and spring. Leave blank if you do not find the deadline."),
        

        ]


    # CV
    cv_response_schemas = [
        ResponseSchema(
            name="applicant_name",
            description="The full name of the applicant. Extract only the name without any titles or additional words."
        ),
        ResponseSchema(
            name="email",
            description="The email address of the applicant."
        ),
        ResponseSchema(
            name="phone_number",
            description="The phone number of the applicant, including country and area codes if available."
        ),
        ResponseSchema(
            name="last_achieved_degree",
            description="The most recent degree obtained by the applicant. Format: Degree, Field of Study, Institution Name, Graduation Year."
        ),
        ResponseSchema(
            name="cgpa",
            description="The Cumulative Grade Point Average (CGPA) of the applicant for their most recent degree."
        ),
        ResponseSchema(
            name="undergraduate_degree",
            description="Information about the applicant's undergraduate degree. Format: Degree, Field of Study, Institution Name, Graduation Year."
        ),
        ResponseSchema(
            name="master_degree",
            description="Information about the applicant's master's degree, if applicable. Format: Degree, Field of Study, Institution Name, Graduation Year."
        ),
        ResponseSchema(
            name="phd_degree",
            description="Information about the applicant's PhD degree, if applicable. Format: Degree, Field of Study, Institution Name, Graduation Year."
        ),
        ResponseSchema(
            name="work_experience",
            description="Type : list of work experience tuples. The work experience of the applicant. This includes the job title, company name, duration of employment, and a brief description of job responsibilities. Format: [(Job Title, Company Name, Duration, Description)]. Multiple work experience "
        ),
        ResponseSchema(
            name="research_projects",
            description="Type: list of research project info tuples. The research projects undertaken by the applicant. This includes the project title, description, institution or organization name, and duration. Format: [(Project Title, Description, Institution/Organization Name, Duration)]"
        ),
        ResponseSchema(
            name="publications",
            description="Type: list of research publications info tuples. The publications of the applicant. This includes the title of the paper, journal or conference name, publication year, and co-authors. Format: [(Title, Journal/Conference Name, Year, Co-authors.)"
        ),
        ResponseSchema(
            name="technical_skills",
            description="A comma-separated list of technical skills possessed by the applicant, such as programming languages, software tools, etc."
        ),
        ResponseSchema(
            name="languages",
            description="A comma-separated list of languages spoken or known by the applicant, along with proficiency levels if mentioned."
        ),
        ResponseSchema(
            name="certifications",
            description="Certifications obtained by the applicant. This includes the certification title, issuing organization, and the date received. Format: Certification Title, Issuing Organization, Date."
        ),
        ResponseSchema(
            name="awards_and_honors",
            description="The awards and honors received by the applicant. This includes the award name, awarding institution, and the year received. Format: Award Name, Awarding Institution, Year."
        ),
        ResponseSchema(
            name="professional_memberships",
            description="The professional memberships of the applicant. This includes the name of the professional society or organization and the membership type (e.g., member, fellow). Format: Organization Name, Membership Type."
        ),
        ResponseSchema(
            name="extracurricular_activities",
            description="The extracurricular activities of the applicant. This includes the activity name, role, and duration. Format: Activity Name, Role, Duration."
        ),
        ResponseSchema(
            name="references",
            description="The references provided by the applicant. This includes the name, title, institution, and contact information of the reference. Format: Name, Title, Institution, Contact Information."
        )
    ]




    sop_response_schemas = [
        ResponseSchema(
            name="applicant_name",
            description="The full name of the applicant mentioned in the SOP."
        ),
        ResponseSchema(
            name="intended_program",
            description="The specific program or field of study the applicant is applying for."
        ),
        ResponseSchema(
            name="research_interests",
            description="The research interests or topics the applicant is passionate about. This should be a comma-separated list if multiple interests are mentioned."
        ),
        ResponseSchema(
            name="career_goals",
            description="The long-term career goals or objectives of the applicant."
        ),
        ResponseSchema(
            name="reason_for_applying",
            description="The primary reason or motivation for applying to the program or institution."
        ),
        ResponseSchema(
            name="relevant_experience",
            description="Any relevant experience mentioned by the applicant that supports their application. This could include internships, projects, or job roles related to the intended program."
        ),
        ResponseSchema(
            name="academic_achievements",
            description="Any notable academic achievements or accolades mentioned in the SOP."
        ),
        ResponseSchema(
            name="strengths_and_skills",
            description="Specific strengths and skills highlighted by the applicant that are relevant to the program."
        ),
        ResponseSchema(
            name="personal_background",
            description="Details about the applicant's personal background that are relevant to their application. This could include personal challenges, diversity experiences, etc."
        ),
        ResponseSchema(
            name="reason_for_choosing_institution",
            description="The specific reasons mentioned by the applicant for choosing the particular institution."
        ),
        ResponseSchema(
            name="future_research_plans",
            description="The applicant's future research plans or projects they intend to work on during the program."
        ),
        ResponseSchema(
            name="publications",
            description="References to any publications or research papers authored by the applicant."
        ),
        ResponseSchema(
            name="extracurricular_activities",
            description="Mention of any extracurricular activities that demonstrate the applicant's well-roundedness or leadership skills."
        ),
        ResponseSchema(
            name="letters_of_recommendation",
            description="Details about the letters of recommendation mentioned in the SOP, including the recommenders' names and affiliations."
        )
    ]
