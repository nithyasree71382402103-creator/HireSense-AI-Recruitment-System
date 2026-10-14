from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class SkillSchema(BaseModel):
    name: str
    category: str
    proficiency: Optional[str] = "Intermediate"

class EducationSchema(BaseModel):
    degree: str
    university: str
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None

class ExperienceSchema(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    responsibilities: Optional[str] = None

class ProjectSchema(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: Optional[str] = None

class CertificationSchema(BaseModel):
    name: str
    issuing_organization: Optional[str] = None
    issue_year: Optional[str] = None

class ResumeParsedData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[SkillSchema] = []
    education: List[EducationSchema] = []
    experience: List[ExperienceSchema] = []
    projects: List[ProjectSchema] = []
    certifications: List[CertificationSchema] = []

class ScoreBreakdown(BaseModel):
    skill_match: float
    keyword_relevance: float
    education: float
    experience: float
    projects: float
    certifications: float
    completeness: float

class ScoreExplanation(BaseModel):
    positives: List[str]
    areas_to_improve: List[str]
    summary: str

class ResumeOut(BaseModel):
    id: int
    candidate_id: int
    file_name: str
    file_type: str
    ats_score: float
    score_breakdown: Optional[Dict[str, Any]] = None
    score_explanation: Optional[Dict[str, Any]] = None
    completeness_score: float
    created_at: datetime
    skills: List[SkillSchema] = []
    education: List[EducationSchema] = []
    experience: List[ExperienceSchema] = []
    projects: List[ProjectSchema] = []
    certifications: List[CertificationSchema] = []

    class Config:
        from_attributes = True
