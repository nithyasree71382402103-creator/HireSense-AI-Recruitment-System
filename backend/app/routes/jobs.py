import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.job import Job, JobSkill
from backend.app.schemas.job import JobCreate, JobUpdate, JobAnalyzeRequest, JobAnalyzeResponse
from backend.app.security.dependencies import get_current_user, require_recruiter
from backend.app.ai.skill_extractor import extract_skills_from_text, extract_keywords

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.post("/analyze-text", response_model=JobAnalyzeResponse)
def analyze_job_text(req: JobAnalyzeRequest):
    """
    Analyzes raw job description text to extract required skills, preferred skills,
    education level, experience years, key responsibilities, and domain keywords.
    Allows recruiters to edit extracted requirements prior to publishing.
    """
    text = req.description
    all_extracted_skills = extract_skills_from_text(text)
    skill_names = [s["name"] for s in all_extracted_skills]

    # Partition required vs preferred based on phrasing
    req_skills = []
    pref_skills = []
    
    # Heuristics
    lower = text.lower()
    for s in skill_names:
        # Check if skill is near 'preferred' or 'nice to have' or 'bonus'
        s_low = s.lower()
        if re.search(rf"(?:preferred|plus|bonus|nice to have).{{0,80}}{re.escape(s_low)}", lower):
            pref_skills.append(s)
        else:
            req_skills.append(s)

    if not req_skills and pref_skills:
        req_skills = pref_skills
        pref_skills = []

    # Experience heuristic
    exp_match = re.search(r"(\d+)\+?\s*(?:to\s*\d+)?\s*years?(?:\s*of)?\s*(?:relevant|experience)", text, re.IGNORECASE)
    min_exp = int(exp_match.group(1)) if exp_match else 2

    # Education heuristic
    edu_str = "Bachelor's Degree in Computer Science, Software Engineering, or related technical field"
    if "master" in lower:
        edu_str = "Master's Degree or Bachelor's in CS / Data Science"

    # Responsibilities extraction (bullet points or lines with action verbs)
    responsibilities = []
    for line in text.split("\n"):
        cl = line.strip()
        if (cl.startswith("-") or cl.startswith("•") or cl.startswith("*")) and len(cl) > 10:
            responsibilities.append(cl.lstrip("-•* "))
    if not responsibilities:
        responsibilities = [
            "Architect and deploy scalable web services and database schemas.",
            "Collaborate with product and engineering team members in iterative sprints.",
            "Write comprehensive automated tests and maintain system documentation."
        ]

    keywords = extract_keywords(text, top_n=12)

    return {
        "required_skills": req_skills[:8],
        "preferred_skills": pref_skills[:6],
        "education": edu_str,
        "min_experience_years": min_exp,
        "responsibilities": responsibilities[:6],
        "keywords": keywords,
    }

@router.post("")
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    if not current_user.recruiter_profile:
        raise HTTPException(status_code=400, detail="Recruiter profile required to post jobs.")

    new_job = Job(
        recruiter_id=current_user.recruiter_profile.id,
        title=job_in.title,
        company=job_in.company or current_user.recruiter_profile.company_name,
        location=job_in.location,
        employment_type=job_in.employment_type,
        description=job_in.description,
        education=job_in.education,
        min_experience_years=job_in.min_experience_years,
        salary_range=job_in.salary_range,
        is_active=True
    )
    db.add(new_job)
    db.flush()

    # If no explicit skills provided, automatically extract from description
    skills_to_add = job_in.skills
    if not skills_to_add:
        extracted = extract_skills_from_text(job_in.description)
        for s in extracted:
            db.add(JobSkill(
                job_id=new_job.id,
                name=s["name"],
                is_required=True,
                category=s["category"]
            ))
    else:
        for s in skills_to_add:
            db.add(JobSkill(
                job_id=new_job.id,
                name=s.name,
                is_required=s.is_required,
                category=s.category or "Technical Skills"
            ))

    db.commit()
    db.refresh(new_job)
    return format_job_response(new_job)

@router.get("")
def list_jobs(
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Job).filter(Job.is_active == True)
    if search:
        query = query.filter((Job.title.ilike(f"%{search}%")) | (Job.description.ilike(f"%{search}%")) | (Job.company.ilike(f"%{search}%")))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if employment_type and employment_type != "All":
        query = query.filter(Job.employment_type == employment_type)

    jobs = query.order_by(Job.created_at.desc()).all()
    return [format_job_response(j) for j in jobs]

@router.get("/my-jobs")
def get_recruiter_jobs(
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    if not current_user.recruiter_profile:
        return []
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.recruiter_profile.id).order_by(Job.created_at.desc()).all()
    return [format_job_response(j) for j in jobs]

@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return format_job_response(job)

@router.put("/{job_id}")
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.recruiter_id != current_user.recruiter_profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this job")

    if job_in.title is not None:
        job.title = job_in.title
    if job_in.company is not None:
        job.company = job_in.company
    if job_in.location is not None:
        job.location = job_in.location
    if job_in.employment_type is not None:
        job.employment_type = job_in.employment_type
    if job_in.description is not None:
        job.description = job_in.description
    if job_in.education is not None:
        job.education = job_in.education
    if job_in.min_experience_years is not None:
        job.min_experience_years = job_in.min_experience_years
    if job_in.salary_range is not None:
        job.salary_range = job_in.salary_range
    if job_in.is_active is not None:
        job.is_active = job_in.is_active

    if job_in.skills is not None:
        # Replace skills
        db.query(JobSkill).filter(JobSkill.job_id == job.id).delete()
        for s in job_in.skills:
            db.add(JobSkill(
                job_id=job.id,
                name=s.name,
                is_required=s.is_required,
                category=s.category or "Technical Skills"
            ))

    db.commit()
    db.refresh(job)
    return format_job_response(job)

def format_job_response(job: Job) -> dict:
    return {
        "id": job.id,
        "recruiter_id": job.recruiter_id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "employment_type": job.employment_type,
        "description": job.description,
        "education": job.education,
        "min_experience_years": job.min_experience_years,
        "salary_range": job.salary_range,
        "is_active": job.is_active,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "skills": [{"id": s.id, "name": s.name, "is_required": s.is_required, "category": s.category} for s in job.skills],
        "application_count": len(job.applications) if job.applications else 0
    }
