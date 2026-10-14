from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from backend.app.schemas.job import JobOut
from backend.app.schemas.resume import ResumeOut

class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: Optional[int] = None
    notes: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: str  # Applied, Resume Analyzed, Under Review, Shortlisted, Interview, Selected, Rejected
    notes: Optional[str] = None

class ApplicationCandidateInfo(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    resume_id: Optional[int] = None
    status: str
    match_score: float
    applied_at: datetime
    status_updated_at: datetime
    notes: Optional[str] = None
    job: Optional[JobOut] = None
    candidate_info: Optional[ApplicationCandidateInfo] = None

    class Config:
        from_attributes = True
