from typing import List, Dict, Any, Set

# Related skill mappings for partial credit & skill transferability
PARTIAL_SKILL_MAP: Dict[str, Dict[str, Any]] = {
    "TypeScript": {"related": ["JavaScript"], "weight": 0.75, "note": "Strong foundation in JavaScript provides high transferability to TypeScript."},
    "PostgreSQL": {"related": ["SQL", "MySQL", "SQLite", "Oracle Database"], "weight": 0.8, "note": "SQL and relational database background provides rapid ramp-up to PostgreSQL."},
    "FastAPI": {"related": ["Python", "Flask", "Django"], "weight": 0.75, "note": "Python backend experience enables swift adoption of FastAPI conventions."},
    "Docker": {"related": ["Linux", "Kubernetes", "CI/CD"], "weight": 0.65, "note": "Linux system administration background bridges concepts to Docker containers."},
    "Kubernetes": {"related": ["Docker", "Linux"], "weight": 0.6, "note": "Containerization skills in Docker form the cornerstone for Kubernetes cluster orchestration."},
    "React": {"related": ["JavaScript", "HTML", "CSS", "Vue.js", "Angular"], "weight": 0.7, "note": "Modern web development fundamentals transfer directly to React components."},
    "Next.js": {"related": ["React", "JavaScript", "TypeScript"], "weight": 0.8, "note": "React component familiarity allows natural progression into Next.js SSR."},
    "AWS": {"related": ["Google Cloud Platform", "Azure", "Cloudflare", "Linux"], "weight": 0.7, "note": "Public cloud infrastructure principles translate across major providers."},
    "Redis": {"related": ["PostgreSQL", "MySQL", "MongoDB"], "weight": 0.6, "note": "Database caching patterns are readily learned from general datastore experience."},
    "Tailwind CSS": {"related": ["CSS", "Bootstrap", "HTML"], "weight": 0.85, "note": "CSS fundamentals allow immediate productivity with Tailwind utility classes."},
}

def match_candidate_to_job(
    candidate_skills: List[str],
    job_required_skills: List[str],
    job_preferred_skills: List[str] = None,
    candidate_experience_years: float = 1.0,
    min_experience_years: int = 0
) -> Dict[str, Any]:
    """
    Computes semantic resume-to-job matching, categorizing:
    - matched_skills: fully satisfied
    - partial_skills: related skill found with credit
    - missing_skills: required skill not possessed
    - overall_match_percentage: weighted calculation
    - match_explanation: explainable rationale
    """
    if job_preferred_skills is None:
        job_preferred_skills = []

    cand_set = {s.strip().lower(): s.strip() for s in candidate_skills}
    
    matched_skills: List[str] = []
    partial_skills: List[Dict[str, str]] = []
    missing_skills: List[str] = []

    # Score calculation variables
    req_total = len(job_required_skills) if job_required_skills else 1
    req_earned = 0.0

    for req in job_required_skills:
        req_clean = req.strip().lower()
        if req_clean in cand_set:
            matched_skills.append(cand_set[req_clean])
            req_earned += 1.0
        else:
            # Check for partial skill transferability
            found_partial = False
            for target_skill, info in PARTIAL_SKILL_MAP.items():
                if target_skill.lower() == req_clean:
                    for rel in info["related"]:
                        if rel.lower() in cand_set:
                            partial_skills.append({
                                "required": req,
                                "possessed": cand_set[rel.lower()],
                                "similarity_note": info["note"]
                            })
                            req_earned += info["weight"]
                            found_partial = True
                            break
                if found_partial:
                    break
            
            if not found_partial:
                missing_skills.append(req)

    # Preferred skills matching
    pref_total = len(job_preferred_skills) if job_preferred_skills else 0
    pref_earned = 0.0
    for pref in job_preferred_skills:
        pref_clean = pref.strip().lower()
        if pref_clean in cand_set:
            if cand_set[pref_clean] not in matched_skills:
                matched_skills.append(cand_set[pref_clean])
            pref_earned += 1.0

    # Calculate overall match percentage
    # Weights: 70% required skills, 20% preferred skills (or fallback to required), 10% experience
    if pref_total > 0:
        skill_score = (req_earned / req_total) * 70.0 + (pref_earned / pref_total) * 20.0
    else:
        skill_score = (req_earned / req_total) * 90.0

    exp_score = min(10.0, 10.0 if candidate_experience_years >= min_experience_years else (candidate_experience_years / max(1, min_experience_years)) * 10.0)
    
    overall_match = round(min(100.0, max(15.0, skill_score + exp_score)), 1)

    # Generate explainable text
    strong_list = matched_skills[:5]
    missing_list = missing_skills[:4]
    
    summary = (
        f"Candidate matches {overall_match}% of the job requirements based on verified technical alignment. "
        f"Demonstrates strong coverage in key competencies with {len(matched_skills)} direct matching skills."
    )

    strengths = [f"Strong match in {s}" for s in strong_list]
    if candidate_experience_years >= min_experience_years and min_experience_years > 0:
        strengths.append(f"Meets or exceeds minimum experience requirement ({min_experience_years}+ years)")

    improvement_recommendations = [f"Focus on acquiring {m} for full role alignment" for m in missing_list]

    return {
        "overall_match_percentage": overall_match,
        "matched_skills": matched_skills,
        "partial_skills": partial_skills,
        "missing_skills": missing_skills,
        "score_breakdown": {
            "required_skills_match": round((req_earned / req_total) * 100, 1),
            "preferred_skills_match": round((pref_earned / max(1, pref_total)) * 100, 1) if pref_total > 0 else 100.0,
            "experience_alignment": round((exp_score / 10.0) * 100, 1),
        },
        "match_explanation": {
            "summary": summary,
            "strong_matches": strong_list,
            "partial_matches": partial_skills,
            "missing_skills": missing_list,
            "strengths": strengths,
            "improvement_recommendations": improvement_recommendations,
        }
    }
