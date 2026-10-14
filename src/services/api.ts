import axios from 'axios';
import {
  User,
  ResumeData,
  Job,
  Application,
  MatchResult,
  SkillGapData,
  RecommendationItem,
  CandidatePoolItem,
  CandidateComparisonItem,
  RecruiterAnalytics,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hiresense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Friendly error message handling
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html>')) {
      return Promise.reject(new Error('Invalid response received from server.'));
    }
    return response;
  },
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/login', credentials);
    return res.data;
  },
  register: async (payload: {
    full_name: string;
    email: string;
    password: string;
    role: string;
    company_name?: string;
    location?: string;
  }) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/register', payload);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  changePassword: async (payload: { current_password?: string; new_password: string }) => {
    const res = await api.put<{ success: boolean; message: string }>('/auth/password', payload);
    return res.data;
  },
};

export const usersApi = {
  updateProfile: async (payload: {
    full_name?: string;
    company_name?: string;
    location?: string;
    bio?: string;
    headline?: string;
    phone?: string;
  }) => {
    const res = await api.put<User>('/users/profile', payload);
    return res.data;
  },
  getSettings: async () => {
    const res = await api.get<{
      email_alerts: boolean;
      match_notifications: boolean;
      pipeline_updates: boolean;
      ai_transparency: boolean;
      data_sharing: boolean;
    }>('/users/settings');
    return res.data;
  },
  updateSettings: async (settings: {
    email_alerts?: boolean;
    match_notifications?: boolean;
    pipeline_updates?: boolean;
    ai_transparency?: boolean;
    data_sharing?: boolean;
  }) => {
    const res = await api.put<{ success: boolean; settings: any }>('/users/settings', settings);
    return res.data;
  },
};

export const resumesApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ResumeData>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  batchUpload: async (jobId: number, files: File[]) => {
    const formData = new FormData();
    formData.append('job_id', String(jobId));
    files.forEach((file) => formData.append('files', file));
    const res = await api.post<{
      uploaded_count: number;
      candidates: Array<{
        candidate_id: number;
        candidate_name: string;
        resume_id: number;
        file_name: string;
        ats_score: number;
        match_percentage: number;
        matched_skills: string[];
        missing_skills: string[];
        status: string;
      }>;
    }>('/resumes/recruiter/batch-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getLatest: async () => {
    const res = await api.get<ResumeData | null>('/resumes/latest');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<ResumeData>(`/resumes/${id}`);
    return res.data;
  },
  reanalyze: async (id: number) => {
    const res = await api.post<ResumeData>(`/resumes/${id}/analyze`);
    return res.data;
  },
};

export const jobsApi = {
  list: async (params?: { search?: string; location?: string; employment_type?: string }) => {
    const res = await api.get<Job[]>('/jobs', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Job>(`/jobs/${id}`);
    return res.data;
  },
  getMyJobs: async () => {
    const res = await api.get<Job[]>('/jobs/my-jobs');
    return res.data;
  },
  create: async (job: {
    title: string;
    company: string;
    location: string;
    employment_type: string;
    description: string;
    education?: string;
    min_experience_years: number;
    salary_range?: string;
    skills?: Array<{ name: string; is_required: boolean; category?: string }>;
  }) => {
    const res = await api.post<Job>('/jobs', job);
    return res.data;
  },
  analyzeText: async (description: string) => {
    const res = await api.post<{
      required_skills: string[];
      preferred_skills: string[];
      education: string;
      min_experience_years: number;
      responsibilities: string[];
      keywords: string[];
    }>('/jobs/analyze-text', { description });
    return res.data;
  },
};

export const matchingApi = {
  getMatch: async (candidateId: number, jobId: number) => {
    const res = await api.get<MatchResult>(`/matching/${candidateId}/${jobId}`);
    return res.data;
  },
  compare: async (candidateIds: number[], jobId?: number) => {
    const res = await api.post<{
      job_title: string;
      candidates: CandidateComparisonItem[];
      decision_support_disclaimer: string;
    }>('/matching/compare', { candidate_ids: candidateIds, job_id: jobId });
    return res.data;
  },
};

export const skillGapApi = {
  getGap: async (candidateId: number, jobId: number) => {
    const res = await api.get<SkillGapData>(`/skill-gap/${candidateId}/${jobId}`);
    return res.data;
  },
};

export const recommendationsApi = {
  getForJob: async (candidateId: number, jobId: number) => {
    const res = await api.get<{
      candidate_id: number;
      job_id: number;
      job_title: string;
      recommendations: RecommendationItem[];
      disclaimer: string;
    }>(`/recommendations/${candidateId}/${jobId}`);
    return res.data;
  },
  getMy: async () => {
    const res = await api.get<{
      job_id: number;
      job_title: string;
      recommendations: RecommendationItem[];
      disclaimer: string;
    }>('/recommendations/candidate/my');
    return res.data;
  },
};

export const applicationsApi = {
  submit: async (jobId: number, notes?: string, resumeId?: number) => {
    const res = await api.post<Application>('/applications', {
      job_id: jobId,
      notes,
      resume_id: resumeId,
    });
    return res.data;
  },
  list: async (params?: { job_id?: number; status_filter?: string }) => {
    const res = await api.get<Application[]>('/applications', { params });
    return res.data;
  },
  updateStatus: async (id: number, status: string, notes?: string) => {
    const res = await api.put<Application>(`/applications/${id}/status`, { status, notes });
    return res.data;
  },
};

export const candidatesApi = {
  list: async (params?: { job_id?: number; min_match?: number; skill_filter?: string; status_filter?: string }) => {
    const res = await api.get<CandidatePoolItem[]>('/candidates', { params });
    return res.data;
  },
  getById: async (id: number, jobId?: number) => {
    const res = await api.get<{
      id: number;
      full_name: string;
      email: string;
      phone?: string;
      location?: string;
      headline?: string;
      bio?: string;
      linkedin_url?: string;
      github_url?: string;
      portfolio_url?: string;
      resume?: ResumeData;
      job_match?: MatchResult;
      applications: Array<{
        id: number;
        job_id: number;
        job_title: string;
        company: string;
        status: string;
        match_score: number;
        applied_at: string;
      }>;
    }>(`/candidates/${id}`, { params: { job_id: jobId } });
    return res.data;
  },
};

export const analyticsApi = {
  getAnalytics: async () => {
    const res = await api.get<RecruiterAnalytics>('/analytics');
    return res.data;
  },
};

export interface BackendStatus {
  status: string;
  service: string;
  version: string;
  port: number;
  uptime_seconds: number;
  database: {
    type: string;
    connected: boolean;
    records: {
      users: number;
      resumes: number;
      jobs: number;
      applications: number;
    };
  };
  ai_engine: {
    provider: string;
    model: string;
    api_key_configured: boolean;
    mode: string;
  };
  system: {
    node_version: string;
    platform: string;
    memory_rss_mb: string;
    memory_heap_mb: string;
  };
  endpoints: Array<{
    method: string;
    path: string;
    desc: string;
  }>;
}

export const backendApi = {
  getStatus: async () => {
    const res = await api.get<BackendStatus>('/backend/status');
    return res.data;
  },
  seedDatabase: async () => {
    const res = await api.post<{ success: boolean; message: string; records: any }>('/backend/seed');
    return res.data;
  },
  resetDatabase: async () => {
    const res = await api.post<{ success: boolean; message: string; records: any }>('/backend/reset');
    return res.data;
  },
  testAi: async (prompt?: string) => {
    const res = await api.post<{
      provider: string;
      model: string;
      prompt: string;
      response: string;
      latency_ms: number;
      timestamp: string;
    }>('/backend/test-ai', { prompt });
    return res.data;
  },
};

export default api;
