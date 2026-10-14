from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, CandidateProfile
from backend.app.models.job import Job
from backend.app.models.resume import Resume
from backend.app.security.dependencies import get_current_user
from backend.app.ai.gap_analyzer import analyze_skill_gap
from backend.app.ai.recommender import generate_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("/{candidate_id}/{job_id}")
def get_recommendations_for_job(
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

    recs = generate_recommendations(gap_data["missing_skills"])

    return {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "job_title": job.title,
        "recommendations": recs,
        "disclaimer": "AI recommendations provide learning guidance and decision support. Completing a course does not guarantee employment."
    }

@router.get("/candidate/my")
def get_my_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate" or not current_user.candidate_profile:
        raise HTTPException(status_code=403, detail="Candidates only")

    cand_id = current_user.candidate_profile.id
    resume = db.query(Resume).filter(Resume.candidate_id == cand_id).order_by(Resume.created_at.desc()).first()
    cand_skills = [s.name for s in resume.skills] if (resume and resume.skills) else []

    # Find highest matching active job or first job
    jobs = db.query(Job).filter(Job.is_active == True).all()
    target_job = jobs[0] if jobs else None
    
    if not target_job:
        return {"recommendations": [], "disclaimer": "AI recommendations provide learning guidance."}

    job_req_skills = [s.name for s in target_job.skills if s.is_required]
    job_pref_skills = [s.name for s in target_job.skills if not s.is_required]

    gap_data = analyze_skill_gap(
        candidate_skills=cand_skills,
        job_required_skills=job_req_skills,
        job_preferred_skills=job_pref_skills
    )

    recs = generate_recommendations(gap_data["missing_skills"])

    return {
        "job_id": target_job.id,
        "job_title": target_job.title,
        "recommendations": recs,
        "disclaimer": "AI recommendations provide learning guidance and decision support. Completing a course does not guarantee employment."
    }
