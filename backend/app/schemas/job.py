from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class JobSkillCreate(BaseModel):
    name: str
    is_required: bool = True
    category: Optional[str] = "Technical Skills"

class JobSkillOut(BaseModel):
    id: int
    name: str
    is_required: bool
    category: str

    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    employment_type: str = "Full-time"
    description: str
    education: Optional[str] = "Bachelor's Degree in Computer Science or related field"
    min_experience_years: int = 0
    salary_range: Optional[str] = "$80,000 - $120,000"
    skills: List[JobSkillCreate] = []

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    education: Optional[str] = None
    min_experience_years: Optional[int] = None
    salary_range: Optional[str] = None
    is_active: Optional[bool] = None
    skills: Optional[List[JobSkillCreate]] = None

class JobOut(BaseModel):
    id: int
    recruiter_id: int
    title: str
    company: str
    location: str
    employment_type: str
    description: str
    education: Optional[str] = None
    min_experience_years: int
    salary_range: Optional[str] = None
    is_active: bool
    created_at: datetime
    skills: List[JobSkillOut] = []
    application_count: Optional[int] = 0

    class Config:
        from_attributes = True

class JobAnalyzeRequest(BaseModel):
    description: str

class JobAnalyzeResponse(BaseModel):
    required_skills: List[str]
    preferred_skills: List[str]
    education: Optional[str] = None
    min_experience_years: int = 0
    responsibilities: List[str]
    keywords: List[str]
