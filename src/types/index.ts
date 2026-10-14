export type UserRole = 'candidate' | 'recruiter';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  company_name?: string;
  profile_id?: number;
}

export interface SkillItem {
  name: string;
  category: string;
  proficiency?: string;
}

export interface EducationItem {
  degree: string;
  university: string;
  graduation_year?: string;
  gpa?: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration?: string;
  responsibilities?: string;
}

export interface ProjectItem {
  name: string;
  description?: string;
  technologies?: string;
}

export interface CertificationItem {
  name: string;
  issuing_organization?: string;
  issue_year?: string;
}

export interface ATSScoreBreakdown {
  skill_match: number;
  keyword_relevance: number;
  education: number;
  experience: number;
  projects: number;
  certifications: number;
  completeness: number;
}

export interface ATSScoreExplanation {
  positives: string[];
  areas_to_improve: string[];
  summary: string;
}

export interface ResumeData {
  id: number;
  candidate_id: number;
  file_name: string;
  file_type: string;
  ats_score: number;
  score_breakdown: ATSScoreBreakdown;
  score_explanation: ATSScoreExplanation;
  completeness_score: number;
  created_at: string;
  skills: SkillItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
}

export interface JobSkill {
  id?: number;
  name: string;
  is_required: boolean;
  category: string;
}

export interface Job {
  id: number;
  recruiter_id: number;
  title: string;
  company: string;
  location: string;
  employment_type: string;
  description: string;
  education?: string;
  min_experience_years: number;
  salary_range?: string;
  is_active: boolean;
  created_at: string;
  skills: JobSkill[];
  application_count: number;
}

export type PipelineStage = 
  | 'Applied'
  | 'Resume Analyzed'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Rejected';

export interface Application {
  id: number;
  candidate_id: number;
  job_id: number;
  resume_id?: number;
  status: PipelineStage;
  match_score: number;
  applied_at: string;
  status_updated_at: string;
  notes?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_location?: string;
  job_title: string;
  job_company: string;
  job_location?: string;
}

export interface PartialMatchDetail {
  required: string;
  possessed: string;
  similarity_note: string;
}

export interface MatchResult {
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  overall_match_percentage: number;
  matched_skills: string[];
  partial_skills: PartialMatchDetail[];
  missing_skills: string[];
  score_breakdown: {
    required_skills_match: number;
    preferred_skills_match: number;
    experience_alignment: number;
  };
  match_explanation: {
    summary: string;
    strong_matches: string[];
    partial_matches: PartialMatchDetail[];
    missing_skills: string[];
    strengths: string[];
    improvement_recommendations: string[];
  };
  calculated_at: string;
  decision_support_disclaimer: string;
}

export interface SkillGapData {
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  strong_skills: string[];
  missing_skills: string[];
  improvement_areas: PartialMatchDetail[];
  overall_match_percentage: number;
  readiness_level: string;
}

export interface RecommendationItem {
  id?: number;
  skill_name: string;
  course_name: string;
  platform: string;
  reason: string;
  difficulty: string;
  priority: 'High' | 'Medium' | 'Low';
  learning_order: number;
  url?: string;
}

export interface CandidatePoolItem {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  job_title: string;
  match_percentage: number;
  ats_score: number;
  top_skills: string[];
  experience_years: number;
  status: string;
  resume_id?: number;
  has_resume: boolean;
}

export interface CandidateComparisonItem {
  candidate_id: number;
  name: string;
  email: string;
  match_percentage: number;
  ats_score: number;
  skills_count: number;
  experience_years: number;
  projects_count: number;
  certifications_count: number;
  matched_skills: string[];
  missing_skills: string[];
  status: string;
}

export interface RecruiterAnalytics {
  total_jobs: number;
  total_candidates: number;
  resumes_analyzed: number;
  total_applications: number;
  shortlisted_count: number;
  under_review_count: number;
  rejected_count: number;
  applications_by_job: Array<{
    job_id: number;
    job_title: string;
    application_count: number;
  }>;
  match_distribution: Array<{
    range: string;
    count: number;
    fill: string;
  }>;
  skill_distribution: Array<{
    skill: string;
    count: number;
  }>;
  pipeline_stages: Array<{
    stage: string;
    count: number;
  }>;
}
