import datetime
from sqlalchemy.orm import Session
from backend.app.models.user import User, CandidateProfile, RecruiterProfile
from backend.app.models.job import Job, JobSkill
from backend.app.models.resume import Resume, ResumeSkill, Education, Experience, Project, Certification
from backend.app.models.application import Application, CandidateScore, SkillGap, Recommendation
from backend.app.security.password import hash_password
from backend.app.ai.ats_scorer import calculate_ats_score
from backend.app.ai.job_matcher import match_candidate_to_job
from backend.app.ai.recommender import generate_recommendations

def seed_database_if_empty(db: Session):
    """Seed baseline recruiters, candidates, jobs, and applications if empty."""
    existing_recruiter = db.query(User).filter(User.email == "recruiter@hiresense.ai").first()
    if existing_recruiter:
        return

    # 1. Create Recruiter
    recruiter_user = User(
        email="recruiter@hiresense.ai",
        hashed_password=hash_password("Recruiter@123"),
        role="recruiter",
        is_active=True
    )
    db.add(recruiter_user)
    db.flush()

    recruiter_profile = RecruiterProfile(
        user_id=recruiter_user.id,
        full_name="Sarah Jenkins",
        company_name="Apex Global Technologies",
        company_website="https://apextech.example.com",
        location="San Francisco, CA"
    )
    db.add(recruiter_profile)
    db.flush()

    # 2. Create Candidate
    candidate_user = User(
        email="candidate@hiresense.ai",
        hashed_password=hash_password("Candidate@123"),
        role="candidate",
        is_active=True
    )
    db.add(candidate_user)
    db.flush()

    candidate_profile = CandidateProfile(
        user_id=candidate_user.id,
        full_name="Alex Rivera",
        phone="+1 (555) 234-5678",
        location="Austin, TX",
        headline="Full Stack Software Engineer (Python, React, PostgreSQL)",
        bio="Passionate engineer building scalable web applications and distributed systems.",
        linkedin_url="https://linkedin.com/in/alexrivera-dev",
        github_url="https://github.com/alexrivera-dev",
        portfolio_url="https://alexrivera.dev"
    )
    db.add(candidate_profile)
    db.flush()

    # Additional Candidate for comparison
    candidate_user2 = User(
        email="candidate2@hiresense.ai",
        hashed_password=hash_password("Candidate@123"),
        role="candidate",
        is_active=True
    )
    db.add(candidate_user2)
    db.flush()

    candidate_profile2 = CandidateProfile(
        user_id=candidate_user2.id,
        full_name="David Chen",
        phone="+1 (555) 987-6543",
        location="Seattle, WA",
        headline="Backend & Cloud Infrastructure Engineer",
        bio="Focused on containerization, high-throughput microservices, and databases.",
        linkedin_url="https://linkedin.com/in/davidchen-cloud",
        github_url="https://github.com/davidchen-cloud"
    )
    db.add(candidate_profile2)
    db.flush()

    # 3. Create Sample Jobs
    jobs_data = [
        {
            "title": "Senior Full Stack Engineer",
            "company": "Apex Global Technologies",
            "location": "San Francisco, CA (Hybrid)",
            "employment_type": "Full-time",
            "description": "We are seeking an experienced Full Stack Engineer to build high-performance cloud applications. You will design RESTful APIs using Python/FastAPI, implement modern React user interfaces, and optimize PostgreSQL queries for scale.",
            "education": "Bachelor's Degree in Computer Science or related field",
            "min_experience_years": 3,
            "salary_range": "$140,000 - $175,000",
            "skills": [
                ("Python", True, "Programming Languages"),
                ("React", True, "Frameworks"),
                ("FastAPI", True, "Frameworks"),
                ("PostgreSQL", True, "Databases"),
                ("TypeScript", True, "Programming Languages"),
                ("Docker", True, "Tools"),
                ("AWS", False, "Cloud"),
                ("Redis", False, "Databases"),
                ("CI/CD", False, "Tools"),
            ]
        },
        {
            "title": "AI / ML Backend Engineer",
            "company": "Apex Global Technologies",
            "location": "Remote (US)",
            "employment_type": "Full-time",
            "description": "Apex is expanding its intelligent workflow platforms. Join us to engineer production inference pipelines, data modeling architectures, and robust API endpoints with automated monitoring.",
            "education": "Master's or Bachelor's in CS, AI, or Data Science",
            "min_experience_years": 2,
            "salary_range": "$130,000 - $160,000",
            "skills": [
                ("Python", True, "Programming Languages"),
                ("PyTorch", True, "AI / Data"),
                ("FastAPI", True, "Frameworks"),
                ("Docker", True, "Tools"),
                ("PostgreSQL", False, "Databases"),
                ("Machine Learning", True, "AI / Data"),
                ("AWS", False, "Cloud"),
            ]
        },
        {
            "title": "Frontend Platform Engineer",
            "company": "Apex Global Technologies",
            "location": "New York, NY",
            "employment_type": "Full-time",
            "description": "Lead the frontend architecture of our next-generation hiring intelligence platform. Collaborate with UI/UX designers to craft responsive, accessible, and fast web experiences.",
            "education": "Bachelor's in Computer Science or equivalent experience",
            "min_experience_years": 2,
            "salary_range": "$125,000 - $155,000",
            "skills": [
                ("React", True, "Frameworks"),
                ("TypeScript", True, "Programming Languages"),
                ("Tailwind CSS", True, "Frameworks"),
                ("Next.js", False, "Frameworks"),
                ("Git", True, "Tools"),
                ("REST API", True, "Frameworks"),
            ]
        }
    ]

    created_jobs = []
    for jd in jobs_data:
        job = Job(
            recruiter_id=recruiter_profile.id,
            title=jd["title"],
            company=jd["company"],
            location=jd["location"],
            employment_type=jd["employment_type"],
            description=jd["description"],
            education=jd["education"],
            min_experience_years=jd["min_experience_years"],
            salary_range=jd["salary_range"],
            is_active=True
        )
        db.add(job)
        db.flush()
        created_jobs.append(job)

        for s_name, s_req, s_cat in jd["skills"]:
            js = JobSkill(
                job_id=job.id,
                name=s_name,
                is_required=s_req,
                category=s_cat
            )
            db.add(js)

    # 4. Create Sample Resumes for candidates
    # Candidate 1: Alex Rivera
    alex_skills = [
        {"name": "Python", "category": "Programming Languages", "proficiency": "Advanced"},
        {"name": "React", "category": "Frameworks", "proficiency": "Advanced"},
        {"name": "JavaScript", "category": "Programming Languages", "proficiency": "Advanced"},
        {"name": "SQL", "category": "Programming Languages", "proficiency": "Intermediate"},
        {"name": "FastAPI", "category": "Frameworks", "proficiency": "Intermediate"},
        {"name": "PostgreSQL", "category": "Databases", "proficiency": "Intermediate"},
        {"name": "Git", "category": "Tools", "proficiency": "Advanced"},
        {"name": "Tailwind CSS", "category": "Frameworks", "proficiency": "Advanced"},
        {"name": "REST API", "category": "Frameworks", "proficiency": "Advanced"},
    ]

    alex_edu = [
        {"degree": "Bachelor of Science in Computer Science", "university": "University of Texas at Austin", "graduation_year": "2023", "gpa": "3.85/4.0"}
    ]

    alex_exp = [
        {"company": "TechPulse Labs", "role": "Software Engineer", "duration": "2023 - Present", "responsibilities": "Engineered full stack features with Python and React. Reduced query response times by 30% through index optimization in PostgreSQL."},
        {"company": "NexGen Innovations", "role": "Full Stack Intern", "duration": "Summer 2022", "responsibilities": "Built dashboard analytics and modular UI components in React."}
    ]

    alex_proj = [
        {"name": "HireSense AI Platform", "description": "AI recruitment management application with automated candidate scoring.", "technologies": "Python, React, PostgreSQL, Tailwind CSS"},
        {"name": "Distributed Task Queue", "description": "Asynchronous job scheduler using Redis and Python workers.", "technologies": "Python, Redis, Docker"}
    ]

    alex_cert = [
        {"name": "AWS Certified Cloud Practitioner", "issuing_organization": "Amazon Web Services", "issue_year": "2024"}
    ]

    ats_calc = calculate_ats_score(
        skills=alex_skills,
        education=alex_edu,
        experience=alex_exp,
        projects=alex_proj,
        certifications=alex_cert,
        raw_text="Alex Rivera Software Engineer Python React PostgreSQL FastAPI"
    )

    resume1 = Resume(
        candidate_id=candidate_profile.id,
        file_name="Alex_Rivera_Resume.pdf",
        file_path="uploads/alex_rivera_resume.pdf",
        file_type="pdf",
        raw_text="Alex Rivera Software Engineer Resume Full Stack Python React PostgreSQL FastAPI",
        ats_score=ats_calc["overall_score"],
        score_breakdown=ats_calc["breakdown"],
        score_explanation=ats_calc["explanation"],
        completeness_score=ats_calc["breakdown"]["completeness"]
    )
    db.add(resume1)
    db.flush()

    for s in alex_skills:
        db.add(ResumeSkill(resume_id=resume1.id, name=s["name"], category=s["category"], proficiency=s["proficiency"]))
    for e in alex_edu:
        db.add(Education(resume_id=resume1.id, degree=e["degree"], university=e["university"], graduation_year=e["graduation_year"], gpa=e["gpa"]))
    for exp in alex_exp:
        db.add(Experience(resume_id=resume1.id, company=exp["company"], role=exp["role"], duration=exp["duration"], responsibilities=exp["responsibilities"]))
    for p in alex_proj:
        db.add(Project(resume_id=resume1.id, name=p["name"], description=p["description"], technologies=p["technologies"]))
    for c in alex_cert:
        db.add(Certification(resume_id=resume1.id, name=c["name"], issuing_organization=c["issuing_organization"], issue_year=c["issue_year"]))

    # Candidate 2: David Chen
    david_skills = [
        {"name": "Python", "category": "Programming Languages", "proficiency": "Advanced"},
        {"name": "Docker", "category": "Tools", "proficiency": "Advanced"},
        {"name": "Kubernetes", "category": "Tools", "proficiency": "Intermediate"},
        {"name": "AWS", "category": "Cloud", "proficiency": "Advanced"},
        {"name": "Linux", "category": "Tools", "proficiency": "Advanced"},
        {"name": "PostgreSQL", "category": "Databases", "proficiency": "Advanced"},
        {"name": "Go", "category": "Programming Languages", "proficiency": "Intermediate"},
    ]
    resume2 = Resume(
        candidate_id=candidate_profile2.id,
        file_name="David_Chen_Resume.pdf",
        file_path="uploads/david_chen_resume.pdf",
        file_type="pdf",
        raw_text="David Chen Backend Engineer Docker Kubernetes AWS PostgreSQL Python",
        ats_score=86.0,
        score_breakdown={"skill_match": 88.0, "keyword_relevance": 85.0, "education": 90.0, "experience": 85.0, "projects": 80.0, "certifications": 80.0, "completeness": 92.0},
        score_explanation={"positives": ["Deep cloud expertise with AWS and Kubernetes", "Strong PostgreSQL capabilities"], "areas_to_improve": ["Add modern frontend framework exposure (React/TypeScript)"], "summary": "Highly capable infrastructure and backend specialist."},
        completeness_score=92.0
    )
    db.add(resume2)
    db.flush()

    for s in david_skills:
        db.add(ResumeSkill(resume_id=resume2.id, name=s["name"], category=s["category"], proficiency=s["proficiency"]))

    # 5. Create Applications & Matching for Primary Job
    primary_job = created_jobs[0]  # Senior Full Stack Engineer
    
    # Calculate match for Alex
    match_alex = match_candidate_to_job(
        candidate_skills=[s["name"] for s in alex_skills],
        job_required_skills=["Python", "React", "FastAPI", "PostgreSQL", "TypeScript", "Docker"],
        job_preferred_skills=["AWS", "Redis", "CI/CD"],
        candidate_experience_years=2.0,
        min_experience_years=3
    )

    app1 = Application(
        candidate_id=candidate_profile.id,
        job_id=primary_job.id,
        resume_id=resume1.id,
        status="Under Review",
        match_score=match_alex["overall_match_percentage"],
        notes="Strong technical background; partial skill transferability on TypeScript via JavaScript."
    )
    db.add(app1)

    db.add(CandidateScore(
        candidate_id=candidate_profile.id,
        job_id=primary_job.id,
        overall_match_percentage=match_alex["overall_match_percentage"],
        matched_skills=match_alex["matched_skills"],
        partial_skills=match_alex["partial_skills"],
        missing_skills=match_alex["missing_skills"],
        score_breakdown=match_alex["score_breakdown"],
        match_explanation=match_alex["match_explanation"]
    ))

    db.add(SkillGap(
        candidate_id=candidate_profile.id,
        job_id=primary_job.id,
        strong_skills=match_alex["matched_skills"],
        missing_skills=match_alex["missing_skills"],
        improvement_areas=match_alex["partial_skills"]
    ))

    # Recommendations for Alex
    alex_recs = generate_recommendations(match_alex["missing_skills"])
    for r in alex_recs:
        db.add(Recommendation(
            candidate_id=candidate_profile.id,
            job_id=primary_job.id,
            skill_name=r["skill_name"],
            course_name=r["course_name"],
            platform=r["platform"],
            reason=r["reason"],
            difficulty=r["difficulty"],
            priority=r["priority"],
            learning_order=r["learning_order"],
            url=r["url"]
        ))

    # Application for David Chen
    match_david = match_candidate_to_job(
        candidate_skills=[s["name"] for s in david_skills],
        job_required_skills=["Python", "React", "FastAPI", "PostgreSQL", "TypeScript", "Docker"],
        job_preferred_skills=["AWS", "Redis", "CI/CD"],
        candidate_experience_years=3.5,
        min_experience_years=3
    )
    app2 = Application(
        candidate_id=candidate_profile2.id,
        job_id=primary_job.id,
        resume_id=resume2.id,
        status="Shortlisted",
        match_score=match_david["overall_match_percentage"],
        notes="Exceptional cloud and DevOps background; needs frontend support."
    )
    db.add(app2)

    db.add(CandidateScore(
        candidate_id=candidate_profile2.id,
        job_id=primary_job.id,
        overall_match_percentage=match_david["overall_match_percentage"],
        matched_skills=match_david["matched_skills"],
        partial_skills=match_david["partial_skills"],
        missing_skills=match_david["missing_skills"],
        score_breakdown=match_david["score_breakdown"],
        match_explanation=match_david["match_explanation"]
    ))

    # Also an application for Job 2
    app3 = Application(
        candidate_id=candidate_profile.id,
        job_id=created_jobs[1].id,
        resume_id=resume1.id,
        status="Applied",
        match_score=68.5,
        notes="Applied directly."
    )
    db.add(app3)

    db.commit()
