import pytest
from backend.app.ai.job_matcher import match_candidate_to_job
from backend.app.ai.gap_analyzer import analyze_skill_gap

def test_job_matching_algorithm():
    cand_skills = ["Python", "JavaScript", "SQL", "Git"]
    req_skills = ["Python", "TypeScript", "PostgreSQL", "Docker"]
    pref_skills = ["AWS", "Redis"]

    result = match_candidate_to_job(
        candidate_skills=cand_skills,
        job_required_skills=req_skills,
        job_preferred_skills=pref_skills,
        candidate_experience_years=2.0,
        min_experience_years=2
    )

    assert "Python" in result["matched_skills"]
    assert len(result["partial_skills"]) > 0  # JS -> TS, SQL -> PostgreSQL
    assert "Docker" in result["missing_skills"]
    assert result["overall_match_percentage"] > 40.0
    assert "summary" in result["match_explanation"]

def test_skill_gap_analysis():
    cand_skills = ["Python", "React"]
    req_skills = ["Python", "React", "Docker", "AWS"]

    gap = analyze_skill_gap(
        candidate_skills=cand_skills,
        job_required_skills=req_skills
    )

    assert "Python" in gap["strong_skills"]
    assert "Docker" in gap["missing_skills"]
    assert "readiness_level" in gap
