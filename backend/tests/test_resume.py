import pytest
from backend.app.ai.skill_extractor import extract_skills_from_text
from backend.app.ai.ats_scorer import calculate_ats_score

def test_skill_extraction():
    sample_text = """
    Experienced Software Engineer with proficiency in Python, React, PostgreSQL, and Docker.
    Built microservices with FastAPI and configured AWS deployments with CI/CD.
    """
    skills = extract_skills_from_text(sample_text)
    names = [s["name"] for s in skills]
    assert "Python" in names
    assert "React" in names
    assert "PostgreSQL" in names
    assert "Docker" in names
    assert "FastAPI" in names
    assert "AWS" in names

def test_ats_scoring_explainable():
    skills = [
        {"name": "Python", "category": "Programming Languages"},
        {"name": "React", "category": "Frameworks"},
        {"name": "PostgreSQL", "category": "Databases"},
    ]
    education = [{"degree": "B.S. in Computer Science", "university": "State University"}]
    experience = [{"company": "Tech Corp", "role": "Software Developer", "responsibilities": "Increased API performance by 40%"}]
    projects = [{"name": "AI App", "description": "Full stack project"}]
    certifications = [{"name": "AWS Certified Developer"}]

    result = calculate_ats_score(
        skills=skills,
        education=education,
        experience=experience,
        projects=projects,
        certifications=certifications,
        raw_text="Sample resume text with Python React PostgreSQL"
    )

    assert result["overall_score"] > 50.0
    assert "skill_match" in result["breakdown"]
    assert "positives" in result["explanation"]
    assert "areas_to_improve" in result["explanation"]
    assert len(result["explanation"]["positives"]) > 0
