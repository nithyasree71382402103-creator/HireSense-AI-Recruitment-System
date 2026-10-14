from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class PartialMatchDetail(BaseModel):
    required: str
    possessed: str
    similarity_note: str

class MatchExplanation(BaseModel):
    summary: str
    strong_matches: List[str]
    partial_matches: List[PartialMatchDetail]
    missing_skills: List[str]
    strengths: List[str]
    improvement_recommendations: List[str]

class MatchResultOut(BaseModel):
    candidate_id: int
    candidate_name: str
    job_id: int
    job_title: str
    overall_match_percentage: float
    matched_skills: List[str]
    partial_skills: List[PartialMatchDetail]
    missing_skills: List[str]
    score_breakdown: Dict[str, float]
    match_explanation: MatchExplanation
    calculated_at: datetime

class SkillGapOut(BaseModel):
    candidate_id: int
    job_id: int
    strong_skills: List[str]
    missing_skills: List[str]
    improvement_areas: List[PartialMatchDetail]
    readiness_level: str

class RecommendationOut(BaseModel):
    id: Optional[int] = None
    skill_name: str
    course_name: str
    platform: str
    reason: str
    difficulty: str
    priority: str
    learning_order: int
    url: Optional[str] = None

class CandidateComparisonItem(BaseModel):
    candidate_id: int
    name: str
    email: str
    match_percentage: float
    ats_score: float
    skills_count: int
    experience_years: float
    projects_count: int
    certifications_count: int
    matched_skills: List[str]
    missing_skills: List[str]
    status: str

class CandidateComparisonOut(BaseModel):
    job_title: str
    candidates: List[CandidateComparisonItem]
    decision_support_disclaimer: str = "AI provides decision support. Final hiring decisions must be made by the recruiter."
