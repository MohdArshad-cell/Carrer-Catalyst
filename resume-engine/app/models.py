from pydantic import BaseModel, Field, AliasChoices
from typing import List, Optional

# ==========================================
# STRICT BUT ADAPTABLE PYDANTIC MODELS
# ==========================================

class PersonalInfo(BaseModel):
    name: Optional[str] = None
    fullName: Optional[str] = Field(None, validation_alias=AliasChoices('fullName', 'full_name'))
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    address: Optional[str] = None

class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None
    startYear: Optional[str] = Field(None, validation_alias=AliasChoices('startYear', 'start_year'))
    endYear: Optional[str] = Field(None, validation_alias=AliasChoices('endYear', 'end_year'))
    # 👇 ADDED 'gpa' ALIAS YAHAN 👇
    grade: Optional[str] = Field(None, validation_alias=AliasChoices('grade', 'gpa'))

class ExperienceItem(BaseModel):
    # 👇 ADDED 'job_title' ALIAS YAHAN 👇
    role: Optional[str] = Field(None, validation_alias=AliasChoices('role', 'title', 'jobTitle', 'position', 'job_title'))
    
    # 👇 ADDED 'company_name' ALIAS YAHAN 👇
    company: Optional[str] = Field(None, validation_alias=AliasChoices('company', 'companyName', 'company_name'))
    
    location: Optional[str] = None
    startDate: Optional[str] = Field(None, validation_alias=AliasChoices('startDate', 'start_date', 'date', 'dates'))
    endDate: Optional[str] = Field(None, validation_alias=AliasChoices('endDate', 'end_date'))
    descriptionPoints: Optional[List[str]] = Field([], validation_alias=AliasChoices('descriptionPoints', 'description_points', 'description', 'bullets', 'details'))

class ProjectItem(BaseModel):
    name: Optional[str] = Field(None, validation_alias=AliasChoices('name', 'projectName', 'project_name', 'title'))
    tech_stack: Optional[str] = Field(None, validation_alias=AliasChoices('tech_stack', 'techStack', 'technologies', 'tools'))
    startDate: Optional[str] = Field(None, validation_alias=AliasChoices('startDate', 'start_date', 'date', 'dates'))
    endDate: Optional[str] = Field(None, validation_alias=AliasChoices('endDate', 'end_date'))
    descriptionPoints: Optional[List[str]] = Field([], validation_alias=AliasChoices('descriptionPoints', 'description_points', 'description', 'bullets', 'details'))

class SkillItem(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None

# ... (Keep PersonalInfo, EducationItem, ExperienceItem, ProjectItem, SkillItem exactly as they are)

class AchievementItem(BaseModel):
    description: Optional[str] = None

class CertificationItem(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None

class ResumeData(BaseModel):
    summary: Optional[str] = None  # 🚨 YEH LINE ADD KAR LE
    personal_info: Optional[PersonalInfo] = Field(None, validation_alias=AliasChoices('personal_info', 'personalInfo'))
    education: Optional[List[EducationItem]] = []
    
    # Safely accepts either 'experience' or 'workExperience' from the frontend
    experience: Optional[List[ExperienceItem]] = Field([], validation_alias=AliasChoices('experience', 'workExperience', 'work_experience'))
    
    projects: Optional[List[ProjectItem]] = []
    skills: Optional[List[SkillItem]] = []
    
    # FIXED: Now matches the exact Object/Dict structure sent by React
    achievements: Optional[List[AchievementItem]] = [] 
    certifications: Optional[List[CertificationItem]] = []

# ... (Keep GenerationRequest, TailorRequest, etc. exactly as they are)

# --- REQUEST MODELS ---
class GenerationRequest(BaseModel):
    # Default template, accepts either naming convention
    template_name: str = Field("modern_line", validation_alias=AliasChoices('template_name', 'templateName'))
    
    # REQUIRED: Do not allow generation without data
    resume_data: ResumeData = Field(..., validation_alias=AliasChoices('resume_data', 'resumeData'))

    model_config = {"extra": "ignore"} 

class TailorRequest(BaseModel):
    # 🚨 REVERTED: Ab yeh user se raw text ya LaTeX code easily accept karega
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