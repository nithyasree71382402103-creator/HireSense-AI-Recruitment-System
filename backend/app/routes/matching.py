from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, CandidateProfile
from backend.app.models.job import Job
from backend.app.models.resume import Resume
from backend.app.models.application import CandidateScore
from backend.app.security.dependencies import get_current_user
from backend.app.ai.job_matcher import match_candidate_to_job
import datetime

router = APIRouter(prefix="/api/matching", tags=["Matching"])

@router.get("/{candidate_id}/{job_id}")
def get_match_result(
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
    
    # Calculate years of experience from resume
    exp_years = len(resume.experience) * 1.5 if (resume and resume.experience) else 1.0

    job_req_skills = [s.name for s in job.skills if s.is_required]
    job_pref_skills = [s.name for s in job.skills if not s.is_required]

    match_result = match_candidate_to_job(
        candidate_skills=cand_skills,
        job_required_skills=job_req_skills,
        job_preferred_skills=job_pref_skills,
        candidate_experience_years=exp_years,
        min_experience_years=job.min_experience_years
    )

    # Cache or update score record
    score_record = db.query(CandidateScore).filter(
        CandidateScore.candidate_id == candidate_id,
        CandidateScore.job_id == job_id
    ).first()

    if not score_record:
        score_record = CandidateScore(
            candidate_id=candidate_id,
            job_id=job_id,
            overall_match_percentage=match_result["overall_match_percentage"],
            matched_skills=match_result["matched_skills"],
            partial_skills=match_result["partial_skills"],
            missing_skills=match_result["missing_skills"],
            score_breakdown=match_result["score_breakdown"],
            match_explanation=match_result["match_explanation"]
        )
        db.add(score_record)
    else:
        score_record.overall_match_percentage = match_result["overall_match_percentage"]
        score_record.matched_skills = match_result["matched_skills"]
        score_record.partial_skills = match_result["partial_skills"]
        score_record.missing_skills = match_result["missing_skills"]
        score_record.score_breakdown = match_result["score_breakdown"]
        score_record.match_explanation = match_result["match_explanation"]
        score_record.calculated_at = datetime.datetime.utcnow()

    db.commit()

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate.full_name,
        "job_id": job_id,
        "job_title": job.title,
        "overall_match_percentage": match_result["overall_match_percentage"],
        "matched_skills": match_result["matched_skills"],
        "partial_skills": match_result["partial_skills"],
        "missing_skills": match_result["missing_skills"],
        "score_breakdown": match_result["score_breakdown"],
        "match_explanation": match_result["match_explanation"],
        "calculated_at": datetime.datetime.utcnow().isoformat(),
        "decision_support_disclaimer": "AI provides decision support. Final hiring decisions must be made by the recruiter."
    }

@router.post("/compare")
def compare_candidates(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Compare multiple candidates factually for a job.
    Includes disclaimer: AI provides decision support. Final hiring decisions must be made by the recruiter.
    """
    candidate_ids: List[int] = payload.get("candidate_ids", [])
    job_id: int = payload.get("job_id")

    if not candidate_ids:
        raise HTTPException(status_code=400, detail="candidate_ids list is required")

    job = db.query(Job).filter(Job.id == job_id).first() if job_id else None
    job_title = job.title if job else "Selected Position"
    job_req_skills = [s.name for s in job.skills if s.is_required] if job else []
    job_pref_skills = [s.name for s in job.skills if not s.is_required] if job else []

    comparison_items = []

    for cid in candidate_ids:
        cand = db.query(CandidateProfile).filter(CandidateProfile.id == cid).first()
        if not cand:
            continue
        resume = db.query(Resume).filter(Resume.candidate_id == cid).order_by(Resume.created_at.desc()).first()
        cand_skills = [s.name for s in resume.skills] if (resume and resume.skills) else []
        exp_years = len(resume.experience) * 1.5 if (resume and resume.experience) else 1.0

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
            match_pct = 75.0
            matched_s = cand_skills[:4]
            missing_s = []

        # Find application status
        app_status = "Under Review"
        if job:
            from backend.app.models.application import Application
            app = db.query(Application).filter(Application.candidate_id == cid, Application.job_id == job.id).first()
            if app:
                app_status = app.status

        comparison_items.append({
            "candidate_id": cand.id,
            "name": cand.full_name,
            "email": cand.user.email if cand.user else "",
            "match_percentage": match_pct,
            "ats_score": resume.ats_score if resume else 0.0,
            "skills_count": len(cand_skills),
            "experience_years": exp_years,
            "projects_count": len(resume.projects) if resume else 0,
            "certifications_count": len(resume.certifications) if resume else 0,
            "matched_skills": matched_s,
            "missing_skills": missing_s,
            "status": app_status,
        })

    # Sort candidates by match percentage descending
    comparison_items.sort(key=lambda x: x["match_percentage"], reverse=True)

    return {
        "job_title": job_title,
        "candidates": comparison_items,
        "decision_support_disclaimer": "AI provides decision support. Final hiring decisions must be made by the recruiter."
    }
