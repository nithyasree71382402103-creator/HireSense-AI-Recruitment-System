from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import CandidateProfile
from backend.app.models.job import Job
from backend.app.models.resume import Resume
from backend.app.ai.gap_analyzer import analyze_skill_gap

router = APIRouter(prefix="/api/skill-gap", tags=["Skill Gap"])

@router.get("/{candidate_id}/{job_id}")
def get_skill_gap(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db)
):
    candidate = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume = db.query(Resume).filter(Resume.candidate_id == candidate_id).order_by(Resume.created_at.desc()).first()
    cand_skills = [s.name for s in resume.skills] if (resume and resume.skills) else []
    
    job_req_skills = [s.name for s in job.skills if s.is_required]
    job_pref_skills = [s.name for s in job.skills if not s.is_required]

    gap_data = analyze_skill_gap(
        candidate_skills=cand_skills,
        job_required_skills=job_req_skills,
        job_preferred_skills=job_pref_skills
    )

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate.full_name,
        "job_id": job_id,
        "job_title": job.title,
        "strong_skills": gap_data["strong_skills"],
        "missing_skills": gap_data["missing_skills"],
        "improvement_areas": gap_data["improvement_areas"],
        "overall_match_percentage": gap_data["overall_match_percentage"],
        "readiness_level": gap_data["readiness_level"],
    }
