from typing import List, Dict, Any
from backend.app.ai.job_matcher import match_candidate_to_job

def analyze_skill_gap(
    candidate_skills: List[str],
    job_required_skills: List[str],
    job_preferred_skills: List[str] = None
) -> Dict[str, Any]:
    """
    Performs skill gap analysis:
    - strong_skills: already possessed skills
    - missing_skills: required/preferred skills not found
    - improvement_areas: partial transferability mappings
    - readiness_level: High, Moderate, Developing
    """
    match_data = match_candidate_to_job(
        candidate_skills=candidate_skills,
        job_required_skills=job_required_skills,
        job_preferred_skills=job_preferred_skills
    )

    match_pct = match_data["overall_match_percentage"]
    if match_pct >= 80:
        readiness = "High Interview Readiness"
    elif match_pct >= 55:
        readiness = "Moderate Alignment - Upskilling Recommended"
    else:
        readiness = "Foundation Stage - Key Technical Gaps Identified"

    return {
        "candidate_skills": candidate_skills,
        "strong_skills": match_data["matched_skills"],
        "missing_skills": match_data["missing_skills"],
        "improvement_areas": match_data["partial_skills"],
        "overall_match_percentage": match_pct,
        "readiness_level": readiness,
    }
