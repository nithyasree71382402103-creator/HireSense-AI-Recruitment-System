import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User, CandidateProfile
from backend.app.models.resume import (
    Resume,
    ResumeSkill,
    Education,
    Experience,
    Project,
    Certification,
)
from backend.app.models.job import Job
from backend.app.models.application import Application, CandidateScore, SkillGap
from backend.app.security.dependencies import get_current_user, require_candidate
from backend.app.services.resume_parser import parse_resume_full
from backend.app.ai.ats_scorer import calculate_ats_score
from backend.app.ai.job_matcher import match_candidate_to_job
from backend.app.ai.recommender import generate_recommendations

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def process_and_save_resume(
    file_bytes: bytes,
    original_filename: str,
    candidate_profile_id: int,
    db: Session
) -> Resume:
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, DOCX, TXT.",
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB.",
        )

    # Save to disk
    unique_name = f"{uuid.uuid4().hex}_{original_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Parse resume
    parsed = parse_resume_full(file_path, ext)

    # Calculate ATS score
    ats_result = calculate_ats_score(
        skills=parsed["skills"],
        education=parsed["education"],
        experience=parsed["experience"],
        projects=parsed["projects"],
        certifications=parsed["certifications"],
        raw_text=parsed["raw_text"],
    )

    # Create Resume entity
    resume = Resume(
        candidate_id=candidate_profile_id,
        file_name=original_filename,
        file_path=file_path,
        file_type=ext,
        raw_text=parsed["raw_text"],
        ats_score=ats_result["overall_score"],
        score_breakdown=ats_result["breakdown"],
        score_explanation=ats_result["explanation"],
        completeness_score=ats_result["breakdown"]["completeness"],
    )
    db.add(resume)
    db.flush()

    # Save extracted skills
    for s in parsed["skills"]:
        db.add(ResumeSkill(
            resume_id=resume.id,
            name=s["name"],
            category=s["category"],
            proficiency=s.get("proficiency", "Intermediate")
        ))

    # Save education
    for edu in parsed["education"]:
        db.add(Education(
            resume_id=resume.id,
            degree=edu["degree"],
            university=edu["university"],
            graduation_year=edu.get("graduation_year"),
            gpa=edu.get("gpa"),
        ))

    # Save experience
    for exp in parsed["experience"]:
        db.add(Experience(
            resume_id=resume.id,
            company=exp["company"],
            role=exp["role"],
            duration=exp.get("duration"),
            responsibilities=exp.get("responsibilities"),
        ))

    # Save projects
    for proj in parsed["projects"]:
        db.add(Project(
            resume_id=resume.id,
            name=proj["name"],
            description=proj.get("description"),
            technologies=proj.get("technologies"),
        ))

    # Save certifications
    for cert in parsed["certifications"]:
        db.add(Certification(
            resume_id=resume.id,
            name=cert["name"],
            issuing_organization=cert.get("issuing_organization"),
            issue_year=cert.get("issue_year"),
        ))

    # Update candidate profile contact details if present
    contact = parsed["contact"]
    cand = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_profile_id).first()
    if cand:
        if contact.get("phone") and not cand.phone:
            cand.phone = contact["phone"]
        if contact.get("location") and not cand.location:
            cand.location = contact["location"]
        if contact.get("linkedin_url") and not cand.linkedin_url:
            cand.linkedin_url = contact["linkedin_url"]
        if contact.get("github_url") and not cand.github_url:
            cand.github_url = contact["github_url"]
        if contact.get("portfolio_url") and not cand.portfolio_url:
            cand.portfolio_url = contact["portfolio_url"]

    db.commit()
    db.refresh(resume)
    return resume

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Candidates only can upload personal resumes.")
    
    if not current_user.candidate_profile:
        raise HTTPException(status_code=400, detail="Candidate profile not found.")

    content = await file.read()
    resume = process_and_save_resume(
        file_bytes=content,
        original_filename=file.filename,
        candidate_profile_id=current_user.candidate_profile.id,
        db=db
    )

    return format_resume_response(resume)

@router.post("/recruiter/batch-upload")
async def batch_upload_resumes_for_job(
    job_id: int = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow recruiters to upload multiple candidate resumes against a specific job."""
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can batch upload candidate resumes.")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    results = []
    job_req_skills = [s.name for s in job.skills if s.is_required]
    job_pref_skills = [s.name for s in job.skills if not s.is_required]

    for file in files:
        content = await file.read()
        name_clean = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ")
        
        # Create virtual candidate user and profile for this candidate resume
        virtual_email = f"candidate_{uuid.uuid4().hex[:6]}@example.com"
        virtual_user = User(
            email=virtual_email,
            hashed_password="hashed_placeholder_for_batch",
            role="candidate",
            is_active=True
        )
        db.add(virtual_user)
        db.flush()

        cand_prof = CandidateProfile(
            user_id=virtual_user.id,
            full_name=name_clean.title(),
            location=job.location
        )
        db.add(cand_prof)
        db.flush()

        resume = process_and_save_resume(
            file_bytes=content,
            original_filename=file.filename,
            candidate_profile_id=cand_prof.id,
            db=db
        )

        cand_skills = [s.name for s in resume.skills]
        match_data = match_candidate_to_job(
            candidate_skills=cand_skills,
            job_required_skills=job_req_skills,
            job_preferred_skills=job_pref_skills,
            candidate_experience_years=len(resume.experience) * 1.5,
            min_experience_years=job.min_experience_years
        )

        # Create application record
        app = Application(
            candidate_id=cand_prof.id,
            job_id=job.id,
            resume_id=resume.id,
            status="Resume Analyzed",
            match_score=match_data["overall_match_percentage"],
            notes="Uploaded via recruiter multiple resume ingestion."
        )
        db.add(app)
        
        db.add(CandidateScore(
            candidate_id=cand_prof.id,
            job_id=job.id,
            overall_match_percentage=match_data["overall_match_percentage"],
            matched_skills=match_data["matched_skills"],
            partial_skills=match_data["partial_skills"],
            missing_skills=match_data["missing_skills"],
            score_breakdown=match_data["score_breakdown"],
            match_explanation=match_data["match_explanation"]
        ))
        db.commit()

        results.append({
            "candidate_id": cand_prof.id,
            "candidate_name": cand_prof.full_name,
            "resume_id": resume.id,
            "file_name": resume.file_name,
            "ats_score": resume.ats_score,
            "match_percentage": match_data["overall_match_percentage"],
            "matched_skills": match_data["matched_skills"],
            "missing_skills": match_data["missing_skills"],
            "status": "Resume Analyzed"
        })

    return {"uploaded_count": len(results), "candidates": results}

@router.get("")
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "candidate":
        resumes = db.query(Resume).filter(Resume.candidate_id == current_user.candidate_profile.id).order_by(Resume.created_at.desc()).all()
    else:
        resumes = db.query(Resume).order_by(Resume.created_at.desc()).limit(50).all()
    return [format_resume_response(r) for r in resumes]

@router.get("/latest")
def get_latest_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate" or not current_user.candidate_profile:
        raise HTTPException(status_code=403, detail="Candidate only")
    
    resume = db.query(Resume).filter(Resume.candidate_id == current_user.candidate_profile.id).order_by(Resume.created_at.desc()).first()
    if not resume:
        return None
    return format_resume_response(resume)

@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if current_user.role == "candidate" and resume.candidate_id != current_user.candidate_profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this resume")

    return format_resume_response(resume)

@router.post("/{resume_id}/analyze")
def reanalyze_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    skills_data = [{"name": s.name, "category": s.category, "proficiency": s.proficiency} for s in resume.skills]
    edu_data = [{"degree": e.degree, "university": e.university, "graduation_year": e.graduation_year} for e in resume.education]
    exp_data = [{"company": ex.company, "role": ex.role, "duration": ex.duration, "responsibilities": ex.responsibilities} for ex in resume.experience]
    proj_data = [{"name": p.name, "description": p.description, "technologies": p.technologies} for p in resume.projects]
    cert_data = [{"name": c.name, "issuing_organization": c.issuing_organization, "issue_year": c.issue_year} for c in resume.certifications]

    ats_result = calculate_ats_score(
        skills=skills_data,
        education=edu_data,
        experience=exp_data,
        projects=proj_data,
        certifications=cert_data,
        raw_text=resume.raw_text or "",
    )

    resume.ats_score = ats_result["overall_score"]
    resume.score_breakdown = ats_result["breakdown"]
    resume.score_explanation = ats_result["explanation"]
    resume.completeness_score = ats_result["breakdown"]["completeness"]
    db.commit()
    db.refresh(resume)

    return format_resume_response(resume)

def format_resume_response(resume: Resume) -> dict:
    return {
        "id": resume.id,
        "candidate_id": resume.candidate_id,
        "file_name": resume.file_name,
        "file_type": resume.file_type,
        "ats_score": resume.ats_score,
        "score_breakdown": resume.score_breakdown or {},
        "score_explanation": resume.score_explanation or {},
        "completeness_score": resume.completeness_score,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
        "skills": [{"name": s.name, "category": s.category, "proficiency": s.proficiency} for s in resume.skills],
        "education": [{"degree": e.degree, "university": e.university, "graduation_year": e.graduation_year, "gpa": e.gpa} for e in resume.education],
        "experience": [{"company": ex.company, "role": ex.role, "duration": ex.duration, "responsibilities": ex.responsibilities} for ex in resume.experience],
        "projects": [{"name": p.name, "description": p.description, "technologies": p.technologies} for p in resume.projects],
        "certifications": [{"name": c.name, "issuing_organization": c.issuing_organization, "issue_year": c.issue_year} for c in resume.certifications],
    }
