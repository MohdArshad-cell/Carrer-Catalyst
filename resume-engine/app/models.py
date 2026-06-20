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