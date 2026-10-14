from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import CandidateProfile
from backend.app.models.resume import Resume
from backend.app.models.job import Job
from backend.app.models.application import Application, CandidateScore
from backend.app.security.dependencies import get_current_user, require_recruiter
from backend.app.ai.job_matcher import match_candidate_to_job
from backend.app.routes.resumes import format_resume_response

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("")
def list_candidates(
    job_id: Optional[int] = Query(None),
    min_match: Optional[float] = Query(None),
    skill_filter: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    candidates = db.query(CandidateProfile).all()
    results = []

    job = db.query(Job).filter(Job.id == job_id).first() if job_id else None
    job_req_skills = [s.name for s in job.skills if s.is_required] if job else []
    job_pref_skills = [s.name for s in job.skills if not s.is_required] if job else []

    for cand in candidates:
        resume = db.query(Resume).filter(Resume.candidate_id == cand.id).order_by(Resume.created_at.desc()).first()
        cand_skills = [s.name for s in resume.skills] if (resume and resume.skills) else []
        exp_years = len(resume.experience) * 1.5 if (resume and resume.experience) else 1.0

        # Calculate match against selected job or default to highest score
        if job:
            match = match_candidate_to_job(
                candidate_skills=cand_skills,
                job_required_skills=job_req_skills,
                job_preferred_skills=job_pref_skills,
                candidate_experience_years=exp_years,
                min_experience_years=job.min_experience_years
            )
            match_pct = match["overall_match_percentage"]
            matched_s = match["matched_skills"]
            missing_s = match["missing_skills"]
        else:
            # Fallback average
            match_pct = resume.ats_score if resume else 0.0
            matched_s = cand_skills[:4]
            missing_s = []

        # Find application
        app = db.query(Application).filter(Application.candidate_id == cand.id).order_by(Application.applied_at.desc()).first()
        app_status = app.status if app else "Candidate Pool"
        app_job_title = app.job.title if (app and app.job) else (job.title if job else "General Talent Pool")

        # Filters
        if min_match and match_pct < min_match:
            continue
        if skill_filter and not any(skill_filter.lower() in s.lower() for s in cand_skills):
            continue
        if status_filter and status_filter != "All" and app_status != status_filter:
            continue

        results.append({
            "id": cand.id,
            "user_id": cand.user_id,
            "full_name": cand.full_name,
            "email": cand.user.email if cand.user else "",
            "phone": cand.phone,
            "location": cand.location,
            "headline": cand.headline,
            "job_title": app_job_title,
            "match_percentage": match_pct,
            "ats_score": resume.ats_score if resume else 0.0,
            "top_skills": cand_skills[:6],
            "experience_years": exp_years,
            "status": app_status,
            "resume_id": resume.id if resume else None,
            "has_resume": resume is not None,
        })

    # Sort candidates by match % descending
    results.sort(key=lambda c: c["match_percentage"], reverse=True)
    return results

@router.get("/{candidate_id}")
def get_candidate_details(
    candidate_id: int,
    job_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cand = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    resume = db.query(Resume).filter(Resume.candidate_id == candidate_id).order_by(Resume.created_at.desc()).first()
    
    # Calculate match with selected job if requested
    match_info = None
    if job_id:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job and resume:
            cand_skills = [s.name for s in resume.skills]
            match_info = match_candidate_to_job(
                candidate_skills=cand_skills,
                job_required_skills=[s.name for s in job.skills if s.is_required],
                job_preferred_skills=[s.name for s in job.skills if not s.is_required],
                candidate_experience_years=len(resume.experience) * 1.5,
                min_experience_years=job.min_experience_years
            )

    apps = db.query(Application).filter(Application.candidate_id == candidate_id).order_by(Application.applied_at.desc()).all()

    return {
        "id": cand.id,
        "full_name": cand.full_name,
        "email": cand.user.email if cand.user else "",
        "phone": cand.phone,
        "location": cand.location,
        "headline": cand.headline,
        "bio": cand.bio,
        "linkedin_url": cand.linkedin_url,
        "github_url": cand.github_url,
        "portfolio_url": cand.portfolio_url,
        "resume": format_resume_response(resume) if resume else None,
        "job_match": match_info,
        "applications": [
            {
                "id": a.id,
                "job_id": a.job_id,
                "job_title": a.job.title if a.job else "",
                "company": a.job.company if a.job else "",
                "status": a.status,
                "match_score": a.match_score,
                "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            }
            for a in apps
        ]
    }
