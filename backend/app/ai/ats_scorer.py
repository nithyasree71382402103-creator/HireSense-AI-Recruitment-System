from typing import Dict, Any, List

def calculate_ats_score(
    skills: List[Dict[str, Any]],
    education: List[Dict[str, Any]],
    experience: List[Dict[str, Any]],
    projects: List[Dict[str, Any]],
    certifications: List[Dict[str, Any]],
    raw_text: str = ""
) -> Dict[str, Any]:
    """
    Calculates a multi-dimensional ATS score (0-100) based on extracted resume components.
    Returns:
      overall_score: float (0 - 100)
      breakdown: {skill_match, keyword_relevance, education, experience, projects, certifications, completeness}
      explanation: {positives: [...], areas_to_improve: [...], summary: str}
    """
    # 1. Skill Match & Breadth (Max 25 pts)
    skill_count = len(skills)
    skill_score = min(25.0, skill_count * 2.5)  # 10 skills = 25 pts

    # 2. Experience & Action Impact (Max 25 pts)
    exp_count = len(experience)
    exp_score = min(25.0, exp_count * 10.0 + (5.0 if exp_count > 0 else 0.0))
    # Check for metrics/quantified results in experience text
    has_metrics = False
    for exp in experience:
        resp = str(exp.get("responsibilities", ""))
        if any(c in resp for c in ["%", "$", "increased", "reduced", "improved", "delivered", "scaled"]):
            has_metrics = True
            break
    if has_metrics and exp_score < 25.0:
        exp_score = min(25.0, exp_score + 5.0)

    # 3. Projects (Max 15 pts)
    proj_count = len(projects)
    project_score = min(15.0, proj_count * 5.0)

    # 4. Education (Max 15 pts)
    edu_count = len(education)
    edu_score = 15.0 if edu_count >= 1 else 5.0

    # 5. Certifications (Max 10 pts)
    cert_count = len(certifications)
    cert_score = min(10.0, cert_count * 5.0)

    # 6. Keyword Coverage & Text Format (Max 10 pts)
    text_length = len(raw_text.split()) if raw_text else 0
    if text_length >= 250:
        keyword_score = 10.0
    elif text_length >= 100:
        keyword_score = 7.0
    else:
        keyword_score = 4.0

    raw_total = skill_score + exp_score + project_score + edu_score + cert_score + keyword_score
    overall_score = round(min(98.0, max(20.0, raw_total)), 1)

    # Completeness calculation
    sections_present = sum([
        1 if skill_count > 0 else 0,
        1 if edu_count > 0 else 0,
        1 if exp_count > 0 else 0,
        1 if proj_count > 0 else 0,
        1 if cert_count > 0 else 0,
        1 if text_length > 100 else 0,
    ])
    completeness = round((sections_present / 6.0) * 100.0, 1)

    # Generate Explainable Feedback
    positives: List[str] = []
    areas_to_improve: List[str] = []

    # Positives analysis
    skill_names = [s.get("name", "") for s in skills]
    if "Python" in skill_names:
        positives.append("Strong proficiency identified in Python")
    if "React" in skill_names:
        positives.append("Modern frontend capability verified in React")
    if "PostgreSQL" in skill_names or "MySQL" in skill_names or "MongoDB" in skill_names:
        positives.append("Solid relational/NoSQL database background documented")
    if proj_count >= 2:
        positives.append(f"Demonstrated practical implementation with {proj_count} detailed projects")
    if edu_count > 0:
        positives.append("Formal education credentials verified")
    if has_metrics:
        positives.append("Experience highlights measurable achievements and impact metrics")
    if cert_count > 0:
        positives.append(f"Validated industry competence with {cert_count} certification(s)")
    if not positives:
        positives.append("Resume contains readable contact and baseline structure")

    # Improvement areas
    if "Docker" not in skill_names and "Kubernetes" not in skill_names:
        areas_to_improve.append("Consider adding containerization skills (e.g., Docker, Kubernetes)")
    if "AWS" not in skill_names and "Google Cloud Platform" not in skill_names and "Azure" not in skill_names:
        areas_to_improve.append("Cloud platform familiarity (AWS/GCP/Azure) is recommended for modern roles")
    if not has_metrics and exp_count > 0:
        areas_to_improve.append("Experience section could include more measurable outcomes (e.g., % improvement, latency reduction)")
    if cert_count == 0:
        areas_to_improve.append("Adding professional certifications would strengthen ATS credibility")
    if proj_count < 2:
        areas_to_improve.append("Showcasing 2-3 end-to-end full stack projects improves competitive ranking")
    if skill_count < 6:
        areas_to_improve.append("Expand explicit technical skill keywords to increase ATS indexing match")

    summary = (
        f"Candidate scored an ATS rating of {overall_score}%. "
        f"{'Resume demonstrates a strong technical profile with solid alignment.' if overall_score >= 75 else 'Resume has foundational content with clear upside through targeted keyword and project refinement.'}"
    )

    return {
        "overall_score": overall_score,
        "breakdown": {
            "skill_match": round((skill_score / 25.0) * 100, 1),
            "keyword_relevance": round((keyword_score / 10.0) * 100, 1),
            "education": round((edu_score / 15.0) * 100, 1),
            "experience": round((exp_score / 25.0) * 100, 1),
            "projects": round((project_score / 15.0) * 100, 1),
            "certifications": round((cert_score / 10.0) * 100, 1),
            "completeness": completeness,
        },
        "explanation": {
            "positives": positives,
            "areas_to_improve": areas_to_improve,
            "summary": summary,
        }
    }
