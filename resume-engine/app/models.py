from pydantic import BaseModel, Field, AliasChoices
from typing import List, Optional

# ==========================================
# STEP 1: JOB DESCRIPTION ANALYSIS SCHEMA
# ==========================================
# Forces Gemini to extract and categorize the JD perfectly before we tailor.
class JobDescriptionAnalysis(BaseModel):
    target_job_title: str = Field(
        ..., 
        description="The primary job title of the open role. Default to 'Software Engineer' if not explicitly stated."
    )
    must_have_tech_skills: List[str] = Field(
        [], 
        description="Array of absolute required technical skills, programming languages, or software tools."
    )
    sdlc_and_practices: List[str] = Field(
        [], 
        description="Array of required methodologies, frameworks, or concepts (e.g., Agile, CI/CD, Microservices, REST APIs)."
    )
    good_to_have_skills: List[str] = Field(
        [], 
        description="Array of preferred or 'nice to have' skills."
    )

# ==========================================
# STEP 2: STRICT RESUME SCHEMAS (AI-OPTIMIZED)
# ==========================================
class PersonalInfo(BaseModel):
    name: Optional[str] = None
    fullName: Optional[str] = Field(None, validation_alias=AliasChoices('fullName', 'full_name'))
    email: Optional[str] = None
    phone: Optional[str] = None
    
    linkedin: Optional[str] = Field(None, validation_alias=AliasChoices('linkedin', 'linkedin_handle'))
    github: Optional[str] = Field(None, validation_alias=AliasChoices('github', 'github_handle'))
    
    address: Optional[str] = None
    portfolio_url: Optional[str] = Field(None, validation_alias=AliasChoices('portfolioUrl', 'portfolio_url'))

class EducationItem(BaseModel):
    degree: Optional[str] = Field(None, description="The specific degree earned, e.g., 'Bachelor of Science in Computer Science'")
    institution: Optional[str] = None
    location: Optional[str] = None
    year: Optional[str] = None
    startYear: Optional[str] = Field(None, validation_alias=AliasChoices('startYear', 'start_year'))
    endYear: Optional[str] = Field(None, validation_alias=AliasChoices('endYear', 'end_year'))
    grade: Optional[str] = Field(None, validation_alias=AliasChoices('grade', 'gpa'))

class ExperienceItem(BaseModel):
    role: Optional[str] = Field(
        None, 
        description="The exact professional job title.", 
        validation_alias=AliasChoices('role', 'title', 'jobTitle', 'position', 'job_title')
    )
    company: Optional[str] = Field(None, validation_alias=AliasChoices('company', 'companyName', 'company_name'))
    location: Optional[str] = None
    startDate: Optional[str] = Field(None, validation_alias=AliasChoices('startDate', 'start_date', 'date', 'dates'))
    endDate: Optional[str] = Field(None, validation_alias=AliasChoices('endDate', 'end_date'))
    descriptionPoints: Optional[List[str]] = Field(
        [], 
        description="An array of high-impact bullet points. CRITICAL: Never hallucinate, invent, or inflate numerical metrics or dates. Maintain absolute factual truth.", 
        validation_alias=AliasChoices('descriptionPoints', 'description_points', 'description', 'bullets', 'details')
    )

class ProjectItem(BaseModel):
    name: Optional[str] = Field(None, validation_alias=AliasChoices('name', 'projectName', 'project_name', 'title'))
    tech_stack: Optional[str] = Field(
        None, 
        description="A comma-separated string of technologies used (e.g., 'Python, React, PostgreSQL'). Normalize capitalization.", 
        validation_alias=AliasChoices('tech_stack', 'techStack', 'technologies', 'tools')
    )
    startDate: Optional[str] = Field(None, validation_alias=AliasChoices('startDate', 'start_date', 'date', 'dates'))
    endDate: Optional[str] = Field(None, validation_alias=AliasChoices('endDate', 'end_date'))
    descriptionPoints: Optional[List[str]] = Field(
        [], 
        description="An array of project achievements. Weave SDLC practices naturally without forcing buzzwords.",
        validation_alias=AliasChoices('descriptionPoints', 'description_points', 'description', 'bullets', 'details')
    )

class SkillItem(BaseModel):
    name: Optional[str] = Field(None, description="The category or specific name of the skill")
    value: Optional[str] = Field(None, description="The proficiency level or comma-separated list of skills within a category")

class AchievementItem(BaseModel):
    description: Optional[str] = None

class CertificationItem(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None

class ResumeData(BaseModel):
    summary: Optional[str] = Field(
        None, 
        description="A powerful executive summary. Weave in the target job title naturally into the first sentence."
    )
    personal_info: Optional[PersonalInfo] = Field(None, validation_alias=AliasChoices('personal_info', 'personalInfo'))
    education: Optional[List[EducationItem]] = []
    
    # Safely accepts either 'experience' or 'workExperience' from the frontend
    experience: Optional[List[ExperienceItem]] = Field([], validation_alias=AliasChoices('experience', 'workExperience', 'work_experience'))
    
    projects: Optional[List[ProjectItem]] = []
    skills: Optional[List[SkillItem]] = []
    
    achievements: Optional[List[AchievementItem]] = [] 
    certifications: Optional[List[CertificationItem]] = []

class CoverLetterContact(BaseModel):
    phone: str = Field(..., description="Phone number. Leave empty string if not found.")
    email: str = Field(..., description="Email address. Leave empty string if not found.")
    linkedin: str = Field(..., description="LinkedIn URL. Leave empty string if not found.")
    address: str = Field(..., description="Location or Address. Leave empty string if not found.")

class CoverLetterData(BaseModel):
    candidate_name: str = Field(..., description="Full name of the candidate")
    candidate_contact: CoverLetterContact = Field(..., description="Contact details extracted from the resume")
    date: str = Field(..., description="The exact date provided in the prompt")
    salutation: str = Field(..., description="E.g., 'Dear Hiring Manager,'")
    opening_hook: str = Field(..., description="The opening paragraph hook")
    body_paragraphs: List[str] = Field(..., description="The proof and connection paragraphs")
    call_to_action: str = Field(..., description="The closing paragraph")
    sign_off: str = Field(..., description="E.g., 'Yours Faithfully,'")

# ==========================================
# API REQUEST MODELS
# ==========================================

class GenerationRequest(BaseModel):
    template_name: str = Field("modern_line", validation_alias=AliasChoices('template_name', 'templateName'))
    resume_data: ResumeData = Field(..., validation_alias=AliasChoices('resume_data', 'resumeData'))
    model_config = {"extra": "ignore"} 

class TailorRequest(BaseModel):
    resume_text: str = Field(..., validation_alias=AliasChoices('resume_text', 'resumeText'))
    job_description: str = Field(..., validation_alias=AliasChoices('job_description', 'jobDescription'))
    template_name: str = Field("modern_line", validation_alias=AliasChoices('template_name', 'templateName'))
    model_config = {"extra": "ignore"}

class EvaluateRequest(BaseModel):
    resume_text: str = Field(..., validation_alias=AliasChoices('resume_text', 'resumeText', 'resume'))
    job_description: str = Field(..., validation_alias=AliasChoices('job_description', 'jobDescription'))
    model_config = {"extra": "ignore"}

class CoverLetterRequest(BaseModel):
    resume_text: str = Field(..., validation_alias=AliasChoices('resume_text', 'resumeText'))
    job_description: str = Field(..., validation_alias=AliasChoices('job_description', 'jobDescription'))
    model_config = {"extra": "ignore"}

class InterviewRequest(BaseModel):
    job_description: str = Field(..., validation_alias=AliasChoices('job_description', 'jobDescription'))
    model_config = {"extra": "ignore"}

class LinkedInRequest(BaseModel):
    linkedin_content: str = Field(..., validation_alias=AliasChoices('linkedin_content', 'linkedinContent'))
    job_description: str = Field(..., validation_alias=AliasChoices('job_description', 'jobDescription'))
    model_config = {"extra": "ignore"}

class OutreachRequest(BaseModel):
    resume_text: str = Field(..., validation_alias=AliasChoices('resume_text', 'resumeText'))
    job_description: str = Field(..., validation_alias=AliasChoices('job_description', 'jobDescription'))
    model_config = {"extra": "ignore"}

class RoadmapRequest(BaseModel):
    resume_text: str = Field(..., validation_alias=AliasChoices('resume_text', 'resumeText'))
    target_goal: str = Field(..., validation_alias=AliasChoices('target_goal', 'targetGoal'))
    model_config = {"extra": "ignore"}

class BulletRewriteRequest(BaseModel):
    bullet_text: str = Field(..., validation_alias=AliasChoices('bullet_text', 'bulletText'))
    target_role: str = Field(None, validation_alias=AliasChoices('target_role', 'targetRole'))
    model_config = {"extra": "ignore"}

class ResignationRequest(BaseModel):
    employee_name: str = Field(..., validation_alias=AliasChoices('employee_name', 'employeeName'))
    company_name: str = Field(..., validation_alias=AliasChoices('company_name', 'companyName'))
    last_date: str = Field(..., validation_alias=AliasChoices('last_date', 'lastDate'))
    tone: str = Field("professional")
    reason: str = Field(None)
    model_config = {"extra": "ignore"}