from pydantic import BaseModel, Field
from typing import List, Optional, Any

# ==========================================
# SUPER-FLEXIBLE PYDANTIC MODELS
# ==========================================

class PersonalInfo(BaseModel):
    name: Optional[str] = None
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    address: Optional[str] = None

class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None
    startYear: Optional[str] = None
    endYear: Optional[str] = None
    grade: Optional[str] = None

class ExperienceItem(BaseModel):
    role: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    location: Optional[str] = None
    description: Optional[List[str]] = []
    descriptionPoints: Optional[List[str]] = []

class ProjectItem(BaseModel):
    name: Optional[str] = None
    projectName: Optional[str] = None
    tech_stack: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    description: Optional[List[str]] = []
    descriptionPoints: Optional[List[str]] = []

class SkillItem(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None

class ResumeData(BaseModel):
    personal_info: Optional[PersonalInfo] = None
    education: Optional[List[EducationItem]] = []
    
    # Accept both Java's format and original format
    experience: Optional[List[ExperienceItem]] = []
    workExperience: Optional[List[ExperienceItem]] = []
    
    projects: Optional[List[ProjectItem]] = []
    skills: Optional[List[SkillItem]] = []
    achievements: Optional[List[Any]] = []
    certifications: Optional[List[Any]] = []

# --- REQUEST MODELS ---
class GenerationRequest(BaseModel):
    template_name: Optional[str] = "modern_template"
    templateName: Optional[str] = "modern_template"
    resume_data: Optional[ResumeData] = None
    resumeData: Optional[ResumeData] = None

    model_config = {"extra": "ignore"} # Ignore any unknown garbage Java sends

class TailorRequest(BaseModel):
    resume_text: Optional[str] = Field(None, alias="resumeText")
    job_description: Optional[str] = Field(None, alias="jobDescription")
    model_config = {"populate_by_name": True, "extra": "ignore"}

class EvaluateRequest(BaseModel):
    resume_text: Optional[str] = Field(None, alias="resumeText")
    resume: Optional[str] = None 
    job_description: Optional[str] = Field(None, alias="jobDescription")
    model_config = {"populate_by_name": True, "extra": "ignore"}

class CoverLetterRequest(BaseModel):
    resume_text: Optional[str] = Field(None, alias="resumeText")
    job_description: Optional[str] = Field(None, alias="jobDescription")
    model_config = {"populate_by_name": True, "extra": "ignore"}

class InterviewRequest(BaseModel):
    job_description: Optional[str] = Field(None, alias="jobDescription")
    model_config = {"populate_by_name": True, "extra": "ignore"}