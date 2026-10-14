import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.job import Job
from backend.app.models.resume import Resume
from backend.app.models.application import Application, CandidateScore, Notification
from backend.app.schemas.application import ApplicationCreate, ApplicationStatusUpdate
from backend.app.security.dependencies import get_current_user, require_candidate, require_recruiter
from backend.app.ai.job_matcher import match_candidate_to_job

router = APIRouter(prefix="/api/applications", tags=["Applications"])

VALID_STAGES = [
    "Applied",
    "Resume Analyzed",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Selected",
    "Rejected",
]

@router.post("")
def submit_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    cand_profile = current_user.candidate_profile
    if not cand_profile:
        raise HTTPException(status_code=400, detail="Candidate profile not found")

    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job or not job.is_active:
        raise HTTPException(status_code=404, detail="Job not found or no longer active")

    # Prevent duplicate applications
    existing = db.query(Application).filter(
        Application.candidate_id == cand_profile.id,
        Application.job_id == app_in.job_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this position."
        )

    # Use specified resume or latest
    resume = None
    if app_in.resume_id:
        resume = db.query(Resume).filter(Resume.id == app_in.resume_id, Resume.candidate_id == cand_profile.id).first()
    if not resume:
        resume = db.query(Resume).filter(Resume.candidate_id == cand_profile.id).order_by(Resume.created_at.desc()).first()

    cand_skills = [s.name for s in resume.skills] if (resume and resume.skills) else []
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

    new_app = Application(
        candidate_id=cand_profile.id,
        job_id=job.id,
        resume_id=resume.id if resume else None,
        status="Applied",
        match_score=match_result["overall_match_percentage"],
        notes=app_in.notes or "Direct application submitted by candidate."
    )
    db.add(new_app)

    # Store candidate score
    db.add(CandidateScore(
        candidate_id=cand_profile.id,
        job_id=job.id,
        overall_match_percentage=match_result["overall_match_percentage"],
        matched_skills=match_result["matched_skills"],
        partial_skills=match_result["partial_skills"],
        missing_skills=match_result["missing_skills"],
        score_breakdown=match_result["score_breakdown"],
        match_explanation=match_result["match_explanation"]
    ))

    db.commit()
    db.refresh(new_app)

    return format_app_response(new_app)

@router.get("")
def list_applications(
    job_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if current_user.role == "candidate":
        query = query.filter(Application.candidate_id == current_user.candidate_profile.id)
    else:
        # Recruiter sees applications for their jobs
        recruiter = current_user.recruiter_profile
        if recruiter:
            rec_job_ids = [j.id for j in recruiter.jobs]
            query = query.filter(Application.job_id.in_(rec_job_ids))

    if job_id:
        query = query.filter(Application.job_id == job_id)
    if status_filter and status_filter != "All":
        query = query.filter(Application.status == status_filter)

    apps = query.order_by(Application.applied_at.desc()).all()
    return [format_app_response(a) for a in apps]

@router.get("/{app_id}")
def get_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == "candidate" and app.candidate_id != current_user.candidate_profile.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return format_app_response(app)

@router.put("/{app_id}/status")
def update_application_status(
    app_id: int,
    status_in: ApplicationStatusUpdate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if status_in.status not in VALID_STAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status_in.status}'. Valid stages: {', '.join(VALID_STAGES)}"
        )

    app.status = status_in.status
    app.status_updated_at = datetime.datetime.utcnow()
    if status_in.notes:
        app.notes = status_in.notes

    # Add notification for the candidate
    if app.candidate and app.candidate.user_id:
        db.add(Notification(
            user_id=app.candidate.user_id,
            title="Application Status Updated",
            message=f"Your application for {app.job.title} at {app.job.company} has progressed to: {app.status}",
            link="/candidate/applications"
        ))

    db.commit()
    db.refresh(app)

    return format_app_response(app)

def format_app_response(app: Application) -> dict:
    cand = app.candidate
    job = app.job
    return {
        "id": app.id,
        "candidate_id": app.candidate_id,
        "job_id": app.job_id,
        "resume_id": app.resume_id,
        "status": app.status,
        "match_score": app.match_score,
        "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        "status_updated_at": app.status_updated_at.isoformat() if app.status_updated_at else None,
        "notes": app.notes,
        "candidate_name": cand.full_name if cand else "Candidate",
        "candidate_email": cand.user.email if (cand and cand.user) else "",
        "candidate_location": cand.location if cand else "",
        "job_title": job.title if job else "Job Position",
        "job_company": job.company if job else "Company",
        "job_location": job.location if job else "",
    }
