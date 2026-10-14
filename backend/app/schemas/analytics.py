from typing import List, Dict
from pydantic import BaseModel

class JobApplicationCount(BaseModel):
    job_id: int
    job_title: str
    application_count: int

class ScoreDistributionBucket(BaseModel):
    range: str
    count: int

class SkillDemandItem(BaseModel):
    skill: str
    count: int

class PipelineStageCount(BaseModel):
    stage: str
    count: int

class RecruiterAnalyticsOut(BaseModel):
    total_jobs: int
    total_candidates: int
    resumes_analyzed: int
    total_applications: int
    shortlisted_count: int
    under_review_count: int
    rejected_count: int
    applications_by_job: List[JobApplicationCount]
    match_distribution: List[ScoreDistributionBucket]
    skill_distribution: List[SkillDemandItem]
    pipeline_stages: List[PipelineStageCount]
