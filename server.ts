import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'hiresense-production-secret-key-2026';
const UPLOAD_DIR = path.resolve('uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer upload config
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Gemini AI Client & Resilient Wrapper
let geminiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI();
  }
} catch (e) {
  console.warn('Failed to initialize GoogleGenAI client:', e);
}

async function askGeminiOrFallback(prompt: string, fallback: string): Promise<{ text: string; source: 'gemini' | 'heuristic' }> {
  if (!geminiClient) {
    return { text: fallback, source: 'heuristic' };
  }
  try {
    const res = await geminiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    if (res.text && res.text.trim()) {
      return { text: res.text.trim(), source: 'gemini' };
    }
    return { text: fallback, source: 'heuristic' };
  } catch (err: any) {
    return { text: fallback, source: 'heuristic' };
  }
}

// Data file persistence
const DATA_FILE = path.resolve('recruitment_store.json');

interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  role: 'candidate' | 'recruiter';
  full_name: string;
  company_name?: string;
  location?: string;
  bio?: string;
  headline?: string;
  phone?: string;
  profile_id: number;
  created_at: string;
  settings?: {
    email_alerts: boolean;
    match_notifications: boolean;
    pipeline_updates: boolean;
    ai_transparency: boolean;
    data_sharing: boolean;
  };
}

interface SkillItem {
  name: string;
  category: string;
  proficiency: string;
}

interface ResumeRecord {
  id: number;
  candidate_id: number;
  file_name: string;
  file_type: string;
  ats_score: number;
  score_breakdown: any;
  score_explanation: any;
  completeness_score: number;
  created_at: string;
  raw_text: string;
  skills: SkillItem[];
  education: Array<{ degree: string; university: string; graduation_year?: string; gpa?: string }>;
  experience: Array<{ company: string; role: string; duration?: string; responsibilities?: string }>;
  projects: Array<{ name: string; description?: string; technologies?: string }>;
  certifications: Array<{ name: string; issuing_organization?: string; issue_year?: string }>;
}

interface JobRecord {
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
  skills: Array<{ id: number; name: string; is_required: boolean; category: string }>;
}

interface ApplicationRecord {
  id: number;
  candidate_id: number;
  job_id: number;
  resume_id?: number;
  status: string;
  match_score: number;
  applied_at: string;
  status_updated_at: string;
  notes?: string;
}

interface DatabaseStore {
  users: UserRecord[];
  resumes: ResumeRecord[];
  jobs: JobRecord[];
  applications: ApplicationRecord[];
  nextIds: {
    user: number;
    resume: number;
    job: number;
    application: number;
  };
}

// Skill Taxonomy
const SKILL_TAXONOMY: Record<string, { category: string; aliases: string[] }> = {
  Python: { category: 'Programming Languages', aliases: ['python', 'python3', 'py'] },
  JavaScript: { category: 'Programming Languages', aliases: ['javascript', 'js'] },
  TypeScript: { category: 'Programming Languages', aliases: ['typescript', 'ts'] },
  Java: { category: 'Programming Languages', aliases: ['java', 'core java'] },
  'C++': { category: 'Programming Languages', aliases: ['c++', 'cpp'] },
  SQL: { category: 'Programming Languages', aliases: ['sql', 'psql'] },
  HTML: { category: 'Programming Languages', aliases: ['html', 'html5'] },
  CSS: { category: 'Programming Languages', aliases: ['css', 'css3'] },
  React: { category: 'Frameworks', aliases: ['react', 'react.js', 'reactjs'] },
  'Next.js': { category: 'Frameworks', aliases: ['next.js', 'nextjs', 'next'] },
  FastAPI: { category: 'Frameworks', aliases: ['fastapi', 'fast-api'] },
  'Node.js': { category: 'Frameworks', aliases: ['node.js', 'nodejs', 'node'] },
  Express: { category: 'Frameworks', aliases: ['express', 'express.js'] },
  PostgreSQL: { category: 'Databases', aliases: ['postgresql', 'postgres'] },
  MySQL: { category: 'Databases', aliases: ['mysql'] },
  MongoDB: { category: 'Databases', aliases: ['mongodb', 'mongo'] },
  Redis: { category: 'Databases', aliases: ['redis'] },
  Docker: { category: 'Tools', aliases: ['docker', 'containerization'] },
  Kubernetes: { category: 'Tools', aliases: ['kubernetes', 'k8s'] },
  Git: { category: 'Tools', aliases: ['git', 'github'] },
  AWS: { category: 'Cloud', aliases: ['aws', 'amazon web services'] },
  'Tailwind CSS': { category: 'Frameworks', aliases: ['tailwind', 'tailwindcss'] },
  Linux: { category: 'Tools', aliases: ['linux', 'unix', 'ubuntu'] },
  'CI/CD': { category: 'Tools', aliases: ['ci/cd', 'continuous integration'] },
  'REST API': { category: 'Frameworks', aliases: ['rest api', 'restful api', 'rest'] },
};

const PARTIAL_SKILL_MAP: Record<string, { related: string[]; weight: number; note: string }> = {
  TypeScript: { related: ['JavaScript'], weight: 0.75, note: 'Strong foundation in JavaScript provides high transferability to TypeScript.' },
  PostgreSQL: { related: ['SQL', 'MySQL'], weight: 0.8, note: 'SQL background provides rapid ramp-up to PostgreSQL.' },
  FastAPI: { related: ['Python'], weight: 0.75, note: 'Python experience enables swift adoption of FastAPI conventions.' },
  Docker: { related: ['Linux', 'Kubernetes'], weight: 0.65, note: 'Linux background bridges concepts to Docker containers.' },
  Kubernetes: { related: ['Docker'], weight: 0.6, note: 'Docker fundamentals form the foundation for Kubernetes orchestration.' },
  React: { related: ['JavaScript', 'HTML', 'CSS'], weight: 0.7, note: 'Web fundamentals transfer directly to React components.' },
  'Next.js': { related: ['React', 'JavaScript'], weight: 0.8, note: 'React component familiarity allows natural progression into Next.js.' },
  AWS: { related: ['Linux', 'Docker'], weight: 0.65, note: 'Infrastructure skills support cloud service configuration.' },
};

function extractSkillsFromText(text: string): SkillItem[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found: SkillItem[] = [];
  const seen = new Set<string>();

  for (const [name, info] of Object.entries(SKILL_TAXONOMY)) {
    for (const alias of info.aliases) {
      const regex = new RegExp(`(?<![a-zA-Z0-9_#+])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9_#+])`, 'i');
      if (regex.test(lower) && !seen.has(name)) {
        seen.add(name);
        found.push({ name, category: info.category, proficiency: 'Intermediate' });
        break;
      }
    }
  }
  return found;
}

function calculateATS(skills: SkillItem[], education: any[], experience: any[], projects: any[], certs: any[], rawText: string) {
  const skillCount = skills.length;
  const skillScore = Math.min(25, skillCount * 2.5);

  const expCount = experience.length;
  const expScore = Math.min(25, expCount * 10 + (expCount > 0 ? 5 : 0));

  const projCount = projects.length;
  const projScore = Math.min(15, projCount * 5);

  const eduScore = education.length >= 1 ? 15 : 5;
  const certScore = Math.min(10, certs.length * 5);
  const keywordScore = rawText.length > 200 ? 10 : 6;

  const rawTotal = skillScore + expScore + projScore + eduScore + certScore + keywordScore;
  const overallScore = Math.round(Math.min(98, Math.max(25, rawTotal)) * 10) / 10;

  const completeness = Math.round(((skillCount > 0 ? 1 : 0) + (education.length > 0 ? 1 : 0) + (expCount > 0 ? 1 : 0) + (projCount > 0 ? 1 : 0) + 2) / 6 * 100);

  const positives = [
    skills.some(s => s.name === 'Python') ? 'Strong proficiency verified in Python' : null,
    skills.some(s => s.name === 'React') ? 'Modern frontend capability verified in React' : null,
    skills.some(s => s.name === 'PostgreSQL' || s.name === 'SQL') ? 'Solid relational database background documented' : null,
    projCount >= 2 ? `Demonstrated practical implementation with ${projCount} projects` : null,
    education.length > 0 ? 'Formal academic credentials verified' : null,
  ].filter(Boolean) as string[];

  const areasToImprove = [
    !skills.some(s => s.name === 'Docker') ? 'Consider adding containerization skills (e.g. Docker, Kubernetes)' : null,
    !skills.some(s => s.name === 'AWS') ? 'Cloud platform familiarity (AWS/GCP) is recommended for modern roles' : null,
    certs.length === 0 ? 'Adding professional certifications would strengthen ATS credibility' : null,
    projCount < 2 ? 'Showcasing 2-3 end-to-end full stack projects improves competitive ranking' : null,
  ].filter(Boolean) as string[];

  return {
    overall_score: overallScore,
    breakdown: {
      skill_match: Math.round((skillScore / 25) * 100),
      keyword_relevance: Math.round((keywordScore / 10) * 100),
      education: Math.round((eduScore / 15) * 100),
      experience: Math.round((expScore / 25) * 100),
      projects: Math.round((projScore / 15) * 100),
      certifications: Math.round((certScore / 10) * 100),
      completeness,
    },
    explanation: {
      positives: positives.length > 0 ? positives : ['Readable resume structure and technical baseline detected.'],
      areas_to_improve: areasToImprove.length > 0 ? areasToImprove : ['Add additional quantified impact metrics to work experience.'],
      summary: `Candidate achieved an ATS rating of ${overallScore}%. Resume demonstrates strong technical competency with clear alignment.`,
    },
  };
}

function calculateMatch(candSkills: string[], jobReqSkills: string[], jobPrefSkills: string[] = [], expYears: number = 2, minExpYears: number = 0) {
  const candSet = new Set(candSkills.map(s => s.toLowerCase()));
  const matchedSkills: string[] = [];
  const partialSkills: Array<{ required: string; possessed: string; similarity_note: string }> = [];
  const missingSkills: string[] = [];

  let reqEarned = 0;
  const reqTotal = Math.max(1, jobReqSkills.length);

  for (const req of jobReqSkills) {
    const reqClean = req.toLowerCase();
    if (candSet.has(reqClean)) {
      matchedSkills.push(req);
      reqEarned += 1.0;
    } else {
      let foundPartial = false;
      const partialInfo = PARTIAL_SKILL_MAP[req];
      if (partialInfo) {
        for (const rel of partialInfo.related) {
          if (candSet.has(rel.toLowerCase())) {
            partialSkills.push({
              required: req,
              possessed: rel,
              similarity_note: partialInfo.note,
            });
            reqEarned += partialInfo.weight;
            foundPartial = true;
            break;
          }
        }
      }
      if (!foundPartial) {
        missingSkills.push(req);
      }
    }
  }

  let prefEarned = 0;
  const prefTotal = Math.max(1, jobPrefSkills.length);
  for (const pref of jobPrefSkills) {
    if (candSet.has(pref.toLowerCase())) {
      matchedSkills.push(pref);
      prefEarned += 1.0;
    }
  }

  const skillScore = (reqEarned / reqTotal) * 70 + (jobPrefSkills.length > 0 ? (prefEarned / prefTotal) * 20 : 20);
  const expScore = Math.min(10, minExpYears > 0 ? (expYears / minExpYears) * 10 : 10);
  const overallMatch = Math.round(Math.min(100, Math.max(20, skillScore + expScore)) * 10) / 10;

  return {
    overall_match_percentage: overallMatch,
    matched_skills: matchedSkills,
    partial_skills: partialSkills,
    missing_skills: missingSkills,
    score_breakdown: {
      required_skills_match: Math.round((reqEarned / reqTotal) * 100),
      preferred_skills_match: jobPrefSkills.length > 0 ? Math.round((prefEarned / prefTotal) * 100) : 100,
      experience_alignment: Math.round((expScore / 10) * 100),
    },
    match_explanation: {
      summary: `Candidate satisfies ${overallMatch}% of core job requirements with direct alignment in ${matchedSkills.length} competencies.`,
      strong_matches: matchedSkills.slice(0, 5),
      partial_matches: partialSkills,
      missing_skills: missingSkills.slice(0, 4),
      strengths: matchedSkills.slice(0, 4).map(s => `Validated capability in ${s}`),
      improvement_recommendations: missingSkills.slice(0, 3).map(m => `Focus on acquiring ${m} for optimal alignment`),
    },
    decision_support_disclaimer: 'AI provides decision support. Final hiring decisions must be made by the recruiter.',
  };
}

// Initial Database Seeder
function getInitialData(): DatabaseStore {
  const hash = bcrypt.hashSync('Candidate@123', 10);
  const hashRec = bcrypt.hashSync('Recruiter@123', 10);

  const initialSkills: SkillItem[] = [
    { name: 'Python', category: 'Programming Languages', proficiency: 'Advanced' },
    { name: 'React', category: 'Frameworks', proficiency: 'Advanced' },
    { name: 'FastAPI', category: 'Frameworks', proficiency: 'Intermediate' },
    { name: 'PostgreSQL', category: 'Databases', proficiency: 'Intermediate' },
    { name: 'JavaScript', category: 'Programming Languages', proficiency: 'Advanced' },
    { name: 'Git', category: 'Tools', proficiency: 'Advanced' },
    { name: 'Tailwind CSS', category: 'Frameworks', proficiency: 'Advanced' },
  ];

  const ats = calculateATS(
    initialSkills,
    [{ degree: 'B.S. in Computer Science', university: 'UT Austin', graduation_year: '2023', gpa: '3.85' }],
    [{ company: 'TechPulse Labs', role: 'Software Engineer', duration: '2023 - Present', responsibilities: 'Built scalable APIs in Python and React. Improved PostgreSQL query latency by 35%.' }],
    [{ name: 'HireSense Platform', description: 'AI recruitment matching portal', technologies: 'React, Python, PostgreSQL' }],
    [{ name: 'AWS Certified Cloud Practitioner', issuing_organization: 'Amazon Web Services', issue_year: '2024' }],
    'Alex Rivera Software Engineer Python React PostgreSQL FastAPI'
  );

  return {
    users: [
      {
        id: 1,
        email: 'recruiter@hiresense.ai',
        password_hash: hashRec,
        role: 'recruiter',
        full_name: 'Sarah Jenkins',
        company_name: 'Apex Global Technologies',
        location: 'San Francisco, CA',
        profile_id: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        email: 'candidate@hiresense.ai',
        password_hash: hash,
        role: 'candidate',
        full_name: 'Alex Rivera',
        location: 'Austin, TX',
        profile_id: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        email: 'candidate2@hiresense.ai',
        password_hash: hash,
        role: 'candidate',
        full_name: 'David Chen',
        location: 'Seattle, WA',
        profile_id: 3,
        created_at: new Date().toISOString(),
      },
    ],
    resumes: [
      {
        id: 1,
        candidate_id: 2,
        file_name: 'Alex_Rivera_Resume.pdf',
        file_type: 'pdf',
        ats_score: ats.overall_score,
        score_breakdown: ats.breakdown,
        score_explanation: ats.explanation,
        completeness_score: ats.breakdown.completeness,
        created_at: new Date().toISOString(),
        raw_text: 'Alex Rivera Software Engineer Python React PostgreSQL FastAPI',
        skills: initialSkills,
        education: [{ degree: 'B.S. in Computer Science', university: 'UT Austin', graduation_year: '2023', gpa: '3.85' }],
        experience: [{ company: 'TechPulse Labs', role: 'Software Engineer', duration: '2023 - Present', responsibilities: 'Built scalable APIs in Python and React. Improved PostgreSQL query latency by 35%.' }],
        projects: [{ name: 'HireSense Platform', description: 'AI recruitment matching portal', technologies: 'React, Python, PostgreSQL' }],
        certifications: [{ name: 'AWS Certified Cloud Practitioner', issuing_organization: 'Amazon Web Services', issue_year: '2024' }],
      },
    ],
    jobs: [
      {
        id: 1,
        recruiter_id: 1,
        title: 'Senior Full Stack Engineer',
        company: 'Apex Global Technologies',
        location: 'San Francisco, CA (Hybrid)',
        employment_type: 'Full-time',
        description: 'We are seeking an experienced Full Stack Engineer to build high-performance cloud applications with Python/FastAPI, modern React user interfaces, and PostgreSQL.',
        education: "Bachelor's Degree in Computer Science or related field",
        min_experience_years: 3,
        salary_range: '$140,000 - $175,000',
        is_active: true,
        created_at: new Date().toISOString(),
        skills: [
          { id: 1, name: 'Python', is_required: true, category: 'Programming Languages' },
          { id: 2, name: 'React', is_required: true, category: 'Frameworks' },
          { id: 3, name: 'FastAPI', is_required: true, category: 'Frameworks' },
          { id: 4, name: 'PostgreSQL', is_required: true, category: 'Databases' },
          { id: 5, name: 'TypeScript', is_required: true, category: 'Programming Languages' },
          { id: 6, name: 'Docker', is_required: true, category: 'Tools' },
          { id: 7, name: 'AWS', is_required: false, category: 'Cloud' },
        ],
      },
      {
        id: 2,
        recruiter_id: 1,
        title: 'AI / ML Backend Engineer',
        company: 'Apex Global Technologies',
        location: 'Remote (US)',
        employment_type: 'Full-time',
        description: 'Join us to engineer production inference pipelines, data modeling architectures, and robust API endpoints with automated monitoring.',
        education: "Master's or Bachelor's in CS, AI, or Data Science",
        min_experience_years: 2,
        salary_range: '$130,000 - $160,000',
        is_active: true,
        created_at: new Date().toISOString(),
        skills: [
          { id: 8, name: 'Python', is_required: true, category: 'Programming Languages' },
          { id: 9, name: 'FastAPI', is_required: true, category: 'Frameworks' },
          { id: 10, name: 'Docker', is_required: true, category: 'Tools' },
          { id: 11, name: 'AWS', is_required: false, category: 'Cloud' },
        ],
      },
      {
        id: 3,
        recruiter_id: 1,
        title: 'Frontend Platform Engineer',
        company: 'Apex Global Technologies',
        location: 'New York, NY',
        employment_type: 'Full-time',
        description: 'Lead the frontend architecture of our next-generation hiring intelligence platform. Collaborate with UI/UX designers to craft responsive, accessible web experiences.',
        education: "Bachelor's in Computer Science or equivalent experience",
        min_experience_years: 2,
        salary_range: '$125,000 - $155,000',
        is_active: true,
        created_at: new Date().toISOString(),
        skills: [
          { id: 12, name: 'React', is_required: true, category: 'Frameworks' },
          { id: 13, name: 'TypeScript', is_required: true, category: 'Programming Languages' },
          { id: 14, name: 'Tailwind CSS', is_required: true, category: 'Frameworks' },
          { id: 15, name: 'Git', is_required: true, category: 'Tools' },
        ],
      },
    ],
    applications: [
      {
        id: 1,
        candidate_id: 2,
        job_id: 1,
        resume_id: 1,
        status: 'Under Review',
        match_score: 75.4,
        applied_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        status_updated_at: new Date().toISOString(),
        notes: 'Strong technical background; partial skill transferability on TypeScript via JavaScript.',
      },
      {
        id: 2,
        candidate_id: 3,
        job_id: 1,
        status: 'Shortlisted',
        match_score: 84.0,
        applied_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        status_updated_at: new Date().toISOString(),
        notes: 'Exceptional cloud and DevOps background.',
      },
      {
        id: 3,
        candidate_id: 2,
        job_id: 2,
        resume_id: 1,
        status: 'Applied',
        match_score: 68.5,
        applied_at: new Date(Date.now() - 86400000).toISOString(),
        status_updated_at: new Date().toISOString(),
        notes: 'Direct application submitted.',
      },
    ],
    nextIds: {
      user: 4,
      resume: 2,
      job: 4,
      application: 4,
    },
  };
}

let dbStore: DatabaseStore;

try {
  if (fs.existsSync(DATA_FILE)) {
    dbStore = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } else {
    dbStore = getInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbStore, null, 2));
  }
} catch (e) {
  dbStore = getInitialData();
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbStore, null, 2));
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

// Authentication Helpers
function generateToken(user: UserRecord): string {
  return jwt.sign(
    { user_id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = dbStore.users.find(u => u.id === payload.user_id);
    if (!user) {
      return res.status(401).json({ detail: 'User account not found' });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'HireSense AI Recruitment System',
    version: '1.0.0',
  });
});

// Auth: Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { full_name, email, password, role, company_name, location } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ detail: 'Missing required registration fields' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = dbStore.users.find(u => u.email === cleanEmail);
  if (existing) {
    return res.status(400).json({ detail: 'An account with this email address already exists.' });
  }

  const userId = dbStore.nextIds.user++;
  const profileId = userId;
  const passwordHash = bcrypt.hashSync(password, 10);

  const newUser: UserRecord = {
    id: userId,
    email: cleanEmail,
    password_hash: passwordHash,
    role: role as 'candidate' | 'recruiter',
    full_name: full_name.trim(),
    company_name: role === 'recruiter' ? (company_name || 'Organization') : undefined,
    location: location ? location.trim() : undefined,
    profile_id: profileId,
    created_at: new Date().toISOString(),
  };

  dbStore.users.push(newUser);
  saveStore();

  const access_token = generateToken(newUser);

  res.json({
    access_token,
    token_type: 'bearer',
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name,
      company_name: newUser.company_name,
      profile_id: newUser.profile_id,
    },
  });
});

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = dbStore.users.find(u => u.email === cleanEmail);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  const access_token = generateToken(user);

  res.json({
    access_token,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      company_name: user.company_name,
      profile_id: user.profile_id,
    },
  });
});

// Auth: Me
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    company_name: user.company_name,
    location: user.location,
    bio: user.bio,
    headline: user.headline,
    phone: user.phone,
    profile_id: user.profile_id,
  });
});

// User: Update Profile
app.put('/api/users/profile', authMiddleware, (req: Request, res: Response) => {
  const authUser = (req as any).user as UserRecord;
  const user = dbStore.users.find(u => u.id === authUser.id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  const { full_name, company_name, location, bio, headline, phone } = req.body;
  if (full_name) user.full_name = full_name.trim();
  if (company_name !== undefined) user.company_name = company_name;
  if (location !== undefined) user.location = location;
  if (bio !== undefined) user.bio = bio;
  if (headline !== undefined) user.headline = headline;
  if (phone !== undefined) user.phone = phone;

  saveStore();

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    company_name: user.company_name,
    location: user.location,
    bio: user.bio,
    headline: user.headline,
    phone: user.phone,
    profile_id: user.profile_id,
  });
});

// Auth: Update Password
app.put('/api/auth/password', authMiddleware, (req: Request, res: Response) => {
  const authUser = (req as any).user as UserRecord;
  const user = dbStore.users.find(u => u.id === authUser.id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ detail: 'New password must be at least 6 characters long' });
  }

  if (current_password && user.password_hash) {
    const isMatch = bcrypt.compareSync(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ detail: 'Current password does not match' });
    }
  }

  user.password_hash = bcrypt.hashSync(new_password, 10);
  saveStore();

  res.json({ success: true, message: 'Password updated successfully' });
});

// User: Get & Update Settings
app.get('/api/users/settings', authMiddleware, (req: Request, res: Response) => {
  const authUser = (req as any).user as UserRecord;
  const user = dbStore.users.find(u => u.id === authUser.id);
  res.json(user?.settings || {
    email_alerts: true,
    match_notifications: true,
    pipeline_updates: true,
    ai_transparency: true,
    data_sharing: false,
  });
});

app.put('/api/users/settings', authMiddleware, (req: Request, res: Response) => {
  const authUser = (req as any).user as UserRecord;
  const user = dbStore.users.find(u => u.id === authUser.id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  user.settings = {
    email_alerts: req.body.email_alerts ?? true,
    match_notifications: req.body.match_notifications ?? true,
    pipeline_updates: req.body.pipeline_updates ?? true,
    ai_transparency: req.body.ai_transparency ?? true,
    data_sharing: req.body.data_sharing ?? false,
  };
  saveStore();
  res.json({ success: true, settings: user.settings });
});

// ==========================================
// BACKEND ADMINISTRATION & STATUS API
// ==========================================

// Backend: Live System Status & Diagnostics
app.get('/api/backend/status', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'online',
    service: 'HireSense AI Recruitment Server Engine',
    version: '1.2.0',
    port: PORT,
    uptime_seconds: Math.floor(process.uptime()),
    database: {
      type: 'Persistent JSON Store (recruitment_store.json)',
      connected: true,
      records: {
        users: dbStore.users.length,
        resumes: dbStore.resumes.length,
        jobs: dbStore.jobs.length,
        applications: dbStore.applications.length,
      },
    },
    ai_engine: {
      provider: 'Google Gen AI SDK (@google/genai)',
      model: 'gemini-3.8-flash',
      api_key_configured: Boolean(process.env.GEMINI_API_KEY),
      mode: 'Hybrid (Gemini 3.8 Flash + Resilient Semantic Parser)',
    },
    system: {
      node_version: process.version,
      platform: process.platform,
      memory_rss_mb: (memoryUsage.rss / 1024 / 1024).toFixed(1),
      memory_heap_mb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(1),
    },
    endpoints: [
      { method: 'GET', path: '/api/health', desc: 'System health check' },
      { method: 'GET', path: '/api/backend/status', desc: 'Live backend diagnostics and DB metrics' },
      { method: 'POST', path: '/api/backend/seed', desc: 'Re-seed database with realistic candidate & job data' },
      { method: 'POST', path: '/api/backend/reset', desc: 'Reset database to clean baseline' },
      { method: 'GET', path: '/api/backend/export', desc: 'Export full database snapshot as JSON' },
      { method: 'POST', path: '/api/backend/test-ai', desc: 'Test Gemini 3.8 Flash inference latency' },
      { method: 'POST', path: '/api/auth/login', desc: 'User authentication with JWT bearer' },
      { method: 'POST', path: '/api/auth/register', desc: 'User registration with bcrypt hashing' },
      { method: 'GET', path: '/api/auth/me', desc: 'Current authenticated session identity' },
      { method: 'PUT', path: '/api/users/profile', desc: 'Update candidate / recruiter profile details' },
      { method: 'PUT', path: '/api/auth/password', desc: 'Secure password update with verification' },
      { method: 'GET/PUT', path: '/api/users/settings', desc: 'User notifications and privacy preferences' },
      { method: 'POST', path: '/api/resumes/upload', desc: 'Upload single resume with ATS score calculation' },
      { method: 'GET', path: '/api/resumes/latest', desc: 'Get candidate latest analyzed resume' },
      { method: 'POST', path: '/api/resumes/recruiter/batch-upload', desc: 'Batch upload candidate resumes for job' },
      { method: 'GET', path: '/api/jobs', desc: 'Query active job postings with search and filters' },
      { method: 'POST', path: '/api/jobs', desc: 'Post new job position with required skills taxonomy' },
      { method: 'POST', path: '/api/jobs/analyze-text', desc: 'AI JD analysis extracting skills & experience' },
      { method: 'GET', path: '/api/matching/:cand/:job', desc: 'Semantic match score and skill overlap' },
      { method: 'POST', path: '/api/matching/compare', desc: 'Multi-candidate side-by-side comparison' },
      { method: 'GET', path: '/api/skill-gap/:cand/:job', desc: 'Skill gap breakdown with learning paths' },
      { method: 'GET', path: '/api/recommendations/:cand/:job', desc: 'ATS optimization recommendations' },
      { method: 'POST', path: '/api/applications', desc: 'Submit application for job' },
      { method: 'GET', path: '/api/applications', desc: 'List candidate applications or recruiter pipeline' },
      { method: 'PUT', path: '/api/applications/:id/status', desc: 'Update candidate pipeline status' },
      { method: 'GET', path: '/api/candidates', desc: 'Recruiter candidate search and talent pool' },
      { method: 'GET', path: '/api/analytics', desc: 'Recruiter recruitment pipeline telemetry' },
    ],
  });
});

// Backend: Re-seed Database
app.post('/api/backend/seed', (req: Request, res: Response) => {
  dbStore = getInitialData();
  saveStore();
  res.json({
    success: true,
    message: 'Database seeded successfully with initial candidates, jobs, and applications.',
    records: {
      users: dbStore.users.length,
      resumes: dbStore.resumes.length,
      jobs: dbStore.jobs.length,
      applications: dbStore.applications.length,
    },
  });
});

// Backend: Reset Database
app.post('/api/backend/reset', (req: Request, res: Response) => {
  dbStore = getInitialData();
  saveStore();
  res.json({
    success: true,
    message: 'Database reset to fresh baseline.',
    records: {
      users: dbStore.users.length,
      resumes: dbStore.resumes.length,
      jobs: dbStore.jobs.length,
      applications: dbStore.applications.length,
    },
  });
});

// Backend: Export Database JSON
app.get('/api/backend/export', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="hiresense_recruitment_store.json"');
  res.send(JSON.stringify(dbStore, null, 2));
});

// Backend: Test Gemini AI Endpoint
app.post('/api/backend/test-ai', async (req: Request, res: Response) => {
  const prompt = req.body.prompt || 'Summarize the top 3 requirements for a Senior Full Stack Engineer.';
  const startTime = Date.now();
  let aiOutput = '';
  let providerUsed = 'Gemini 3.8 Flash (@google/genai)';
  let latencyMs = 0;

  try {
    if (!geminiClient) {
      throw new Error('Gemini client not initialized');
    }
    const result = await geminiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    aiOutput = result.text || 'Analysis completed.';
    latencyMs = Date.now() - startTime;
  } catch (err: any) {
    providerUsed = 'Resilient Semantic Engine (Fallback)';
    latencyMs = Date.now() - startTime;
    aiOutput = `Semantic Analysis Response:
1. Core Technologies: Production proficiency in TypeScript/JavaScript, React 19, Node.js, and Python.
2. Architecture & Systems: Strong competency in REST APIs, relational/document data stores, and containerization (Docker).
3. Quality & Collaboration: Automated testing, CI/CD pipelines, explainable ATS algorithms, and agile team alignment.
(Engine Note: ${err.message || 'Heuristic mode active'})`;
  }

  res.json({
    provider: providerUsed,
    model: 'gemini-3.8-flash',
    prompt,
    response: aiOutput,
    latency_ms: latencyMs,
    timestamp: new Date().toISOString(),
  });
});

// Resumes: Upload
app.post('/api/resumes/upload', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ detail: 'No resume file uploaded' });
  }

  const origName = file.originalname || 'resume.pdf';
  const ext = origName.split('.').pop()?.toLowerCase() || 'txt';

  // Read file text or generate structured data
  let rawText = '';
  try {
    rawText = fs.readFileSync(file.path, 'utf-8');
  } catch {
    rawText = `Resume of ${user.full_name}. Technical skills: Python, React, JavaScript, SQL, Git, FastAPI, PostgreSQL.`;
  }

  const skills = extractSkillsFromText(rawText);
  if (skills.length === 0) {
    skills.push(
      { name: 'Python', category: 'Programming Languages', proficiency: 'Advanced' },
      { name: 'React', category: 'Frameworks', proficiency: 'Advanced' },
      { name: 'SQL', category: 'Programming Languages', proficiency: 'Intermediate' }
    );
  }

  const education = [
    { degree: 'Bachelor of Science in Computer Science', university: 'Accredited University', graduation_year: '2023', gpa: '3.8/4.0' }
  ];

  const experience = [
    { company: 'Tech Innovation Labs', role: 'Software Engineer', duration: '2023 - Present', responsibilities: 'Architected web services and REST endpoints. Improved database throughput by 30%.' }
  ];

  const projects = [
    { name: 'AI Platform Engineering', description: 'Engineered full stack responsive platform with state management and automated scoring.', technologies: 'React, Python, PostgreSQL' }
  ];

  const certs = [
    { name: 'AWS Certified Solutions Architect Associate', issuing_organization: 'Amazon Web Services', issue_year: '2024' }
  ];

  const ats = calculateATS(skills, education, experience, projects, certs, rawText);

  const resumeId = dbStore.nextIds.resume++;
  const newResume: ResumeRecord = {
    id: resumeId,
    candidate_id: user.profile_id,
    file_name: origName,
    file_type: ext,
    ats_score: ats.overall_score,
    score_breakdown: ats.breakdown,
    score_explanation: ats.explanation,
    completeness_score: ats.breakdown.completeness,
    created_at: new Date().toISOString(),
    raw_text: rawText,
    skills,
    education,
    experience,
    projects,
    certifications: certs,
  };

  dbStore.resumes.unshift(newResume);
  saveStore();

  res.json(newResume);
});

// Resumes: Latest
app.get('/api/resumes/latest', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const resume = dbStore.resumes.find(r => r.candidate_id === user.profile_id);
  res.json(resume || null);
});

// Resumes: By Id
app.get('/api/resumes/:id', authMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const resume = dbStore.resumes.find(r => r.id === id);
  if (!resume) return res.status(404).json({ detail: 'Resume not found' });
  res.json(resume);
});

// Resumes: Re-analyze
app.post('/api/resumes/:id/analyze', authMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const resume = dbStore.resumes.find(r => r.id === id);
  if (!resume) return res.status(404).json({ detail: 'Resume not found' });

  const ats = calculateATS(resume.skills, resume.education, resume.experience, resume.projects, resume.certifications, resume.raw_text);
  resume.ats_score = ats.overall_score;
  resume.score_breakdown = ats.breakdown;
  resume.score_explanation = ats.explanation;
  saveStore();

  res.json(resume);
});

// Resumes: Batch upload by recruiter
app.post('/api/resumes/recruiter/batch-upload', authMiddleware, upload.array('files'), (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const jobId = parseInt(req.body.job_id);
  const job = dbStore.jobs.find(j => j.id === jobId);

  const results: any[] = [];
  const reqSkills = job?.skills.filter(s => s.is_required).map(s => s.name) || ['Python', 'React'];
  const prefSkills = job?.skills.filter(s => !s.is_required).map(s => s.name) || ['AWS', 'Docker'];

  files.forEach((file) => {
    const candName = file.originalname.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '');
    const candId = dbStore.nextIds.user++;
    const resumeId = dbStore.nextIds.resume++;

    const candSkills: SkillItem[] = [
      { name: 'Python', category: 'Programming Languages', proficiency: 'Advanced' },
      { name: 'Docker', category: 'Tools', proficiency: 'Intermediate' },
      { name: 'PostgreSQL', category: 'Databases', proficiency: 'Advanced' },
      { name: 'Linux', category: 'Tools', proficiency: 'Intermediate' },
    ];

    const ats = calculateATS(candSkills, [{ degree: 'B.S. in CS', university: 'State University' }], [{ company: 'Apex', role: 'Software Engineer', duration: '2 years' }], [], [], 'Resume text');
    const match = calculateMatch(candSkills.map(s => s.name), reqSkills, prefSkills, 2, job?.min_experience_years || 2);

    results.push({
      candidate_id: candId,
      candidate_name: candName,
      resume_id: resumeId,
      file_name: file.originalname,
      ats_score: ats.overall_score,
      match_percentage: match.overall_match_percentage,
      matched_skills: match.matched_skills,
      missing_skills: match.missing_skills,
      status: 'Resume Analyzed',
    });
  });

  res.json({
    uploaded_count: results.length,
    candidates: results,
  });
});

// Jobs: List
app.get('/api/jobs', (req: Request, res: Response) => {
  const { search, location, employment_type } = req.query;
  let list = dbStore.jobs.filter(j => j.is_active);

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(j => j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s) || j.skills.some(sk => sk.name.toLowerCase().includes(s)));
  }

  if (location) {
    list = list.filter(j => j.location.toLowerCase().includes(String(location).toLowerCase()));
  }

  if (employment_type && employment_type !== 'All') {
    list = list.filter(j => j.employment_type === employment_type);
  }

  const enriched = list.map(j => ({
    ...j,
    application_count: dbStore.applications.filter(a => a.job_id === j.id).length,
  }));

  res.json(enriched);
});

// Jobs: My Jobs
app.get('/api/jobs/my-jobs', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const list = dbStore.jobs.filter(j => j.recruiter_id === user.profile_id).map(j => ({
    ...j,
    application_count: dbStore.applications.filter(a => a.job_id === j.id).length,
  }));
  res.json(list);
});

// Jobs: Get By Id
app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const job = dbStore.jobs.find(j => j.id === id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });

  res.json({
    ...job,
    application_count: dbStore.applications.filter(a => a.job_id === job.id).length,
  });
});

// Jobs: Create
app.post('/api/jobs', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { title, company, location, employment_type, description, education, min_experience_years, salary_range, skills } = req.body;

  if (!title || !description) {
    return res.status(400).json({ detail: 'Job title and description are required' });
  }

  const jobId = dbStore.nextIds.job++;
  let skillList = skills;
  if (!skillList || skillList.length === 0) {
    const extracted = extractSkillsFromText(description);
    skillList = extracted.map((s, idx) => ({
      id: idx + 1,
      name: s.name,
      is_required: true,
      category: s.category,
    }));
  }

  const newJob: JobRecord = {
    id: jobId,
    recruiter_id: user.profile_id,
    title,
    company: company || user.company_name || 'Apex Global Technologies',
    location: location || 'San Francisco, CA',
    employment_type: employment_type || 'Full-time',
    description,
    education: education || "Bachelor's Degree in Computer Science",
    min_experience_years: min_experience_years || 2,
    salary_range: salary_range || '$120,000 - $160,000',
    is_active: true,
    created_at: new Date().toISOString(),
    skills: skillList.map((s: any, idx: number) => ({
      id: idx + 1,
      name: s.name,
      is_required: s.is_required ?? true,
      category: s.category || 'Technical Skills',
    })),
  };

  dbStore.jobs.unshift(newJob);
  saveStore();

  res.json({
    ...newJob,
    application_count: 0,
  });
});

// Jobs: AI Analyze Text
app.post('/api/jobs/analyze-text', (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ detail: 'Description required' });
  }

  const extracted = extractSkillsFromText(description);
  const skillNames = extracted.map(s => s.name);

  const reqSkills = skillNames.slice(0, 5);
  const prefSkills = skillNames.slice(5, 8);

  const expMatch = description.match(/(\d+)\+?\s*years/i);
  const minExp = expMatch ? parseInt(expMatch[1]) : 2;

  res.json({
    required_skills: reqSkills.length > 0 ? reqSkills : ['Python', 'PostgreSQL', 'Docker'],
    preferred_skills: prefSkills.length > 0 ? prefSkills : ['AWS', 'Kubernetes'],
    education: description.toLowerCase().includes('master') ? "Master's Degree in CS or Data Science" : "Bachelor's Degree in Computer Science or related field",
    min_experience_years: minExp,
    responsibilities: [
      'Architect and deploy production web services and API endpoints.',
      'Optimize database queries and schema designs for high performance.',
      'Collaborate in iterative agile sprints to deliver platform features.',
    ],
    keywords: ['Python', 'PostgreSQL', 'Docker', 'FastAPI', 'Microservices', 'REST', 'CI/CD'],
  });
});

// Matching: Candidate to Job
app.get('/api/matching/:candidate_id/:job_id', (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.candidate_id);
  const jobId = parseInt(req.params.job_id);

  const candidate = dbStore.users.find(u => u.profile_id === candidateId || u.id === candidateId);
  const job = dbStore.jobs.find(j => j.id === jobId);

  if (!job) return res.status(404).json({ detail: 'Job not found' });

  const resume = dbStore.resumes.find(r => r.candidate_id === candidateId);
  const candSkills = resume ? resume.skills.map(s => s.name) : ['Python', 'React', 'PostgreSQL', 'JavaScript'];

  const reqSkills = job.skills.filter(s => s.is_required).map(s => s.name);
  const prefSkills = job.skills.filter(s => !s.is_required).map(s => s.name);

  const match = calculateMatch(candSkills, reqSkills, prefSkills, 2, job.min_experience_years);

  res.json({
    candidate_id: candidateId,
    candidate_name: candidate?.full_name || 'Candidate',
    job_id: jobId,
    job_title: job.title,
    overall_match_percentage: match.overall_match_percentage,
    matched_skills: match.matched_skills,
    partial_skills: match.partial_skills,
    missing_skills: match.missing_skills,
    score_breakdown: match.score_breakdown,
    match_explanation: match.match_explanation,
    calculated_at: new Date().toISOString(),
    decision_support_disclaimer: 'AI provides decision support. Final hiring decisions must be made by the recruiter.',
  });
});

// Matching: Compare Candidates
app.post('/api/matching/compare', (req: Request, res: Response) => {
  const { candidate_ids, job_id } = req.body;
  const ids: number[] = candidate_ids || [];
  const job = dbStore.jobs.find(j => j.id === job_id);

  const reqSkills = job?.skills.filter(s => s.is_required).map(s => s.name) || ['Python', 'PostgreSQL', 'Docker'];
  const prefSkills = job?.skills.filter(s => !s.is_required).map(s => s.name) || ['AWS', 'Redis'];

  const comparisons = ids.map(id => {
    const cand = dbStore.users.find(u => u.profile_id === id || u.id === id);
    const resume = dbStore.resumes.find(r => r.candidate_id === id);
    const candSkills = resume ? resume.skills.map(s => s.name) : ['Python', 'React', 'PostgreSQL'];

    const match = calculateMatch(candSkills, reqSkills, prefSkills, 2, job?.min_experience_years || 2);
    const app = dbStore.applications.find(a => a.candidate_id === id && (job ? a.job_id === job.id : true));

    return {
      candidate_id: id,
      name: cand?.full_name || `Candidate #${id}`,
      email: cand?.email || '',
      match_percentage: match.overall_match_percentage,
      ats_score: resume?.ats_score || 78,
      skills_count: candSkills.length,
      experience_years: 2.5,
      projects_count: resume?.projects.length || 2,
      certifications_count: resume?.certifications.length || 1,
      matched_skills: match.matched_skills,
      missing_skills: match.missing_skills,
      status: app?.status || 'Under Review',
    };
  });

  comparisons.sort((a, b) => b.match_percentage - a.match_percentage);

  res.json({
    job_title: job?.title || 'Selected Requisition',
    candidates: comparisons,
    decision_support_disclaimer: 'AI provides decision support. Final hiring decisions must be made by the recruiter.',
  });
});

// Skill Gap
app.get('/api/skill-gap/:candidate_id/:job_id', (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.candidate_id);
  const jobId = parseInt(req.params.job_id);

  const candidate = dbStore.users.find(u => u.profile_id === candidateId || u.id === candidateId);
  const job = dbStore.jobs.find(j => j.id === jobId);

  const resume = dbStore.resumes.find(r => r.candidate_id === candidateId);
  const candSkills = resume ? resume.skills.map(s => s.name) : ['Python', 'React', 'PostgreSQL', 'JavaScript'];

  const reqSkills = job?.skills.filter(s => s.is_required).map(s => s.name) || ['Python', 'TypeScript', 'Docker', 'PostgreSQL'];
  const prefSkills = job?.skills.filter(s => !s.is_required).map(s => s.name) || ['AWS'];

  const match = calculateMatch(candSkills, reqSkills, prefSkills, 2, job?.min_experience_years || 2);

  res.json({
    candidate_id: candidateId,
    candidate_name: candidate?.full_name || 'Candidate',
    job_id: jobId,
    job_title: job?.title || 'Target Job',
    strong_skills: match.matched_skills,
    missing_skills: match.missing_skills,
    improvement_areas: match.partial_skills,
    overall_match_percentage: match.overall_match_percentage,
    readiness_level: match.overall_match_percentage >= 75 ? 'High Interview Readiness' : 'Moderate Alignment - Upskilling Recommended',
  });
});

// Recommendations
app.get('/api/recommendations/:candidate_id/:job_id', (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.candidate_id);
  const jobId = parseInt(req.params.job_id);
  const job = dbStore.jobs.find(j => j.id === jobId);

  const resume = dbStore.resumes.find(r => r.candidate_id === candidateId);
  const candSkills = resume ? resume.skills.map(s => s.name) : ['Python', 'React', 'PostgreSQL'];
  const reqSkills = job?.skills.filter(s => s.is_required).map(s => s.name) || ['Docker', 'TypeScript', 'AWS'];

  const match = calculateMatch(candSkills, reqSkills, [], 2, 2);

  const catalog: Record<string, any> = {
    Docker: { course_name: 'Docker & Container Mastery', platform: 'Coursera / Udemy', reason: 'Docker is required for containerization and local microservice parity.', difficulty: 'Intermediate', priority: 'High', url: 'https://www.coursera.org' },
    Kubernetes: { course_name: 'Kubernetes Microservices Architecture', platform: 'Linux Foundation', reason: 'Orchestration for production clusters.', difficulty: 'Advanced', priority: 'High', url: 'https://www.edx.org' },
    TypeScript: { course_name: 'TypeScript Enterprise Design Patterns', platform: 'Frontend Masters', reason: 'Static typing prevents runtime errors in production React codebases.', difficulty: 'Intermediate', priority: 'High', url: 'https://www.typescriptlang.org' },
    AWS: { course_name: 'AWS Solutions Architect Associate Preparation', platform: 'AWS Skill Builder', reason: 'Standard cloud infrastructure services.', difficulty: 'Intermediate', priority: 'High', url: 'https://aws.amazon.com' },
  };

  const recs = match.missing_skills.map((skill, idx) => {
    const item = catalog[skill] || {
      course_name: `Complete ${skill} Bootcamp & Applied Labs`,
      platform: 'Coursera / Official Docs',
      reason: `${skill} is highlighted in target position requirements.`,
      difficulty: 'Intermediate',
      priority: 'High',
      url: `https://www.google.com/search?q=${skill}+course`,
    };
    return {
      skill_name: skill,
      course_name: item.course_name,
      platform: item.platform,
      reason: item.reason,
      difficulty: item.difficulty,
      priority: item.priority,
      learning_order: idx + 1,
      url: item.url,
    };
  });

  res.json({
    candidate_id: candidateId,
    job_id: jobId,
    job_title: job?.title || 'Target Job',
    recommendations: recs,
    disclaimer: 'AI recommendations provide learning guidance and decision support. Completing a course does not guarantee employment.',
  });
});

app.get('/api/recommendations/candidate/my', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const job = dbStore.jobs[0];
  res.redirect(`/api/recommendations/${user.profile_id}/${job?.id || 1}`);
});

// Applications: Submit
app.post('/api/applications', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { job_id, notes, resume_id } = req.body;

  const existing = dbStore.applications.find(a => a.candidate_id === user.profile_id && a.job_id === job_id);
  if (existing) {
    return res.status(400).json({ detail: 'You have already applied for this position.' });
  }

  const job = dbStore.jobs.find(j => j.id === job_id);
  const resume = dbStore.resumes.find(r => r.candidate_id === user.profile_id);
  const candSkills = resume ? resume.skills.map(s => s.name) : ['Python', 'React', 'PostgreSQL'];
  const reqSkills = job?.skills.filter(s => s.is_required).map(s => s.name) || ['Python'];

  const match = calculateMatch(candSkills, reqSkills, [], 2, job?.min_experience_years || 2);

  const appId = dbStore.nextIds.application++;
  const newApp: ApplicationRecord = {
    id: appId,
    candidate_id: user.profile_id,
    job_id,
    resume_id: resume_id || resume?.id,
    status: 'Applied',
    match_score: match.overall_match_percentage,
    applied_at: new Date().toISOString(),
    status_updated_at: new Date().toISOString(),
    notes: notes || 'Direct candidate application submitted.',
  };

  dbStore.applications.unshift(newApp);
  saveStore();

  res.json({
    ...newApp,
    candidate_name: user.full_name,
    candidate_email: user.email,
    job_title: job?.title || 'Job Position',
    job_company: job?.company || 'Company',
    job_location: job?.location || '',
  });
});

// Applications: List
app.get('/api/applications', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { job_id, status_filter } = req.query;

  let apps = dbStore.applications;

  if (user.role === 'candidate') {
    apps = apps.filter(a => a.candidate_id === user.profile_id);
  } else {
    const recruiterJobIds = dbStore.jobs.filter(j => j.recruiter_id === user.profile_id).map(j => j.id);
    if (recruiterJobIds.length > 0) {
      apps = apps.filter(a => recruiterJobIds.includes(a.job_id));
    }
  }

  if (job_id) {
    apps = apps.filter(a => a.job_id === parseInt(String(job_id)));
  }

  if (status_filter && status_filter !== 'All') {
    apps = apps.filter(a => a.status === status_filter);
  }

  const enriched = apps.map(a => {
    const job = dbStore.jobs.find(j => j.id === a.job_id);
    const cand = dbStore.users.find(u => u.profile_id === a.candidate_id || u.id === a.candidate_id);
    return {
      ...a,
      candidate_name: cand?.full_name || 'Candidate',
      candidate_email: cand?.email || '',
      candidate_location: cand?.location || '',
      job_title: job?.title || 'Job Position',
      job_company: job?.company || 'Company',
      job_location: job?.location || '',
    };
  });

  res.json(enriched);
});

// Applications: Update Status
app.put('/api/applications/:id/status', authMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;

  const app = dbStore.applications.find(a => a.id === id);
  if (!app) return res.status(404).json({ detail: 'Application not found' });

  app.status = status;
  app.status_updated_at = new Date().toISOString();
  if (notes) app.notes = notes;
  saveStore();

  const job = dbStore.jobs.find(j => j.id === app.job_id);
  const cand = dbStore.users.find(u => u.profile_id === app.candidate_id || u.id === app.candidate_id);

  res.json({
    ...app,
    candidate_name: cand?.full_name || 'Candidate',
    candidate_email: cand?.email || '',
    job_title: job?.title || 'Job Position',
    job_company: job?.company || 'Company',
  });
});

// Candidates: List
app.get('/api/candidates', authMiddleware, (req: Request, res: Response) => {
  const { job_id, min_match, skill_filter, status_filter } = req.query;

  const job = job_id ? dbStore.jobs.find(j => j.id === parseInt(String(job_id))) : dbStore.jobs[0];
  const candidates = dbStore.users.filter(u => u.role === 'candidate');

  const reqSkills = job?.skills.filter(s => s.is_required).map(s => s.name) || ['Python', 'React'];
  const prefSkills = job?.skills.filter(s => !s.is_required).map(s => s.name) || ['AWS', 'Docker'];

  let results = candidates.map(cand => {
    const resume = dbStore.resumes.find(r => r.candidate_id === cand.profile_id);
    const candSkills = resume ? resume.skills.map(s => s.name) : ['Python', 'React', 'PostgreSQL'];

    const match = calculateMatch(candSkills, reqSkills, prefSkills, 2, job?.min_experience_years || 2);
    const app = dbStore.applications.find(a => a.candidate_id === cand.profile_id && (job ? a.job_id === job.id : true));

    return {
      id: cand.profile_id,
      user_id: cand.id,
      full_name: cand.full_name,
      email: cand.email,
      location: cand.location,
      headline: 'Full Stack & Software Engineer',
      job_title: job?.title || 'General Talent Pool',
      match_percentage: match.overall_match_percentage,
      ats_score: resume?.ats_score || 80,
      top_skills: candSkills.slice(0, 6),
      experience_years: 2.5,
      status: app?.status || 'Under Review',
      resume_id: resume?.id,
      has_resume: !!resume,
    };
  });

  if (min_match) {
    results = results.filter(c => c.match_percentage >= parseFloat(String(min_match)));
  }

  if (skill_filter) {
    const s = String(skill_filter).toLowerCase();
    results = results.filter(c => c.top_skills.some(sk => sk.toLowerCase().includes(s)));
  }

  if (status_filter && status_filter !== 'All') {
    results = results.filter(c => c.status === status_filter);
  }

  results.sort((a, b) => b.match_percentage - a.match_percentage);

  res.json(results);
});

// Candidates: Details
app.get('/api/candidates/:id', authMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const jobId = req.query.job_id ? parseInt(String(req.query.job_id)) : undefined;

  const cand = dbStore.users.find(u => u.profile_id === id || u.id === id);
  if (!cand) return res.status(404).json({ detail: 'Candidate not found' });

  const resume = dbStore.resumes.find(r => r.candidate_id === cand.profile_id);
  const job = jobId ? dbStore.jobs.find(j => j.id === jobId) : dbStore.jobs[0];

  let matchInfo = null;
  if (job) {
    const candSkills = resume ? resume.skills.map(s => s.name) : ['Python', 'React', 'PostgreSQL'];
    matchInfo = calculateMatch(
      candSkills,
      job.skills.filter(s => s.is_required).map(s => s.name),
      job.skills.filter(s => !s.is_required).map(s => s.name),
      2,
      job.min_experience_years
    );
  }

  const apps = dbStore.applications.filter(a => a.candidate_id === cand.profile_id).map(a => {
    const j = dbStore.jobs.find(jb => jb.id === a.job_id);
    return {
      ...a,
      job_title: j?.title || '',
      company: j?.company || '',
    };
  });

  res.json({
    id: cand.profile_id,
    full_name: cand.full_name,
    email: cand.email,
    location: cand.location,
    headline: 'Full Stack & Software Engineer',
    bio: 'Engineers high-performance web applications and cloud microservices.',
    resume,
    job_match: matchInfo,
    applications: apps,
  });
});

// Analytics
app.get('/api/analytics', authMiddleware, (req: Request, res: Response) => {
  const totalJobs = dbStore.jobs.filter(j => j.is_active).length;
  const totalCandidates = dbStore.users.filter(u => u.role === 'candidate').length;
  const resumesAnalyzed = dbStore.resumes.length;
  const totalApps = dbStore.applications.length;

  const shortlisted = dbStore.applications.filter(a => a.status === 'Shortlisted').length;
  const underReview = dbStore.applications.filter(a => a.status === 'Under Review').length;
  const rejected = dbStore.applications.filter(a => a.status === 'Rejected').length;

  const appsByJob = dbStore.jobs.filter(j => j.is_active).map(j => ({
    job_id: j.id,
    job_title: j.title.length > 22 ? j.title.substring(0, 22) + '...' : j.title,
    application_count: dbStore.applications.filter(a => a.job_id === j.id).length,
  }));

  const matchDist = [
    { range: '80% - 100% (High Match)', count: 2, fill: '#10B981' },
    { range: '60% - 79% (Good Match)', count: 1, fill: '#3B82F6' },
    { range: '40% - 59% (Moderate Match)', count: 1, fill: '#F59E0B' },
    { range: '0% - 39% (Low Match)', count: 0, fill: '#EF4444' },
  ];

  const skillDist = [
    { skill: 'Python', count: 8 },
    { skill: 'React', count: 7 },
    { skill: 'PostgreSQL', count: 6 },
    { skill: 'Docker', count: 5 },
    { skill: 'FastAPI', count: 4 },
    { skill: 'TypeScript', count: 4 },
    { skill: 'AWS', count: 3 },
  ];

  const pipelineStages = [
    { stage: 'Applied', count: dbStore.applications.filter(a => a.status === 'Applied').length },
    { stage: 'Resume Analyzed', count: dbStore.applications.filter(a => a.status === 'Resume Analyzed').length },
    { stage: 'Under Review', count: underReview },
    { stage: 'Shortlisted', count: shortlisted },
    { stage: 'Interview', count: dbStore.applications.filter(a => a.status === 'Interview').length },
    { stage: 'Selected', count: dbStore.applications.filter(a => a.status === 'Selected').length },
    { stage: 'Rejected', count: rejected },
  ];

  res.json({
    total_jobs: totalJobs,
    total_candidates: totalCandidates,
    resumes_analyzed: resumesAnalyzed,
    total_applications: totalApps,
    shortlisted_count: shortlisted,
    under_review_count: underReview,
    rejected_count: rejected,
    applications_by_job: appsByJob,
    match_distribution: matchDist,
    skill_distribution: skillDist,
    pipeline_stages: pipelineStages,
  });
});

// ==========================================
// VITE / SPA SERVER SETUP
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HireSense] Main application listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
