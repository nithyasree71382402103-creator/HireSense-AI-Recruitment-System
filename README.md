# HireSense AI — Production-Grade AI Resume Recruitment System

HireSense AI is a full-stack, AI-powered recruitment management system providing dual experiences for **Candidates** and **Recruiters**. Built for academic presentations, hackathons, and enterprise deployment, the platform automates resume ingestion, structured parsing, explainable ATS compatibility rating, semantic job matching, skill gap discovery, and pipeline management.

---

## 🚀 Key Features

### For Candidates
- **Multi-Format Resume Ingestion**: Native parsing for **PDF** (PyMuPDF), **DOCX** (python-docx), and **TXT** files.
- **Explainable ATS Scoring**: Calculates real, multi-factor ATS scores (0–100%) broken down into skill match, keyword relevance, work experience impact, education, projects, and certifications.
- **Actionable Explainability**: Explicit breakdown highlighting strengths (*"✓ Strong match in Python"*, *"✓ Solid relational database background"*) and improvement opportunities (*"⚠ Missing Docker"*, *"⚠ Missing PostgreSQL"*).
- **Skill Taxonomy Extraction**: Categorizes skills into Programming Languages, Frameworks, Databases, Tools/DevOps, and Cloud.
- **Skill Gap Analysis**: Compares candidate's skills against target role requirements, surfacing strong matches, partial/transferable skills (e.g., JavaScript → TypeScript, SQL → PostgreSQL), and missing requirements.
- **Curated Course Recommendations**: Tailored learning resources for missing skills with platform, difficulty, priority, and structured learning order.
- **Job Discovery & 1-Click Apply**: Browse active openings with real-time match percentages and track application stages.

### For Recruiters
- **Recruiter Dashboard & Recharts Analytics**: Real-time analytics tracking applications by job, match distribution bands (donut chart), in-demand skills, and stage funnel counts.
- **AI-Powered Requisition Creation**: Input job descriptions and let the built-in AI NLP extractor identify required skills, preferred qualifications, experience, and responsibilities before publishing.
- **Multi-Resume Batch Upload**: Ingest multiple candidate resumes at once against a requisition, computing instant ATS ratings and match percentages.
- **Ranked Candidate Talent Pool**: Search and filter applicants by job, minimum match %, skills, experience, and pipeline stage.
- **Side-by-Side Candidate Comparison**: Compare multiple candidates across factual criteria without automated hiring bias.
- **Interactive Hiring Pipeline**: Kanban workflow progressing candidates across 7 stages:
  $$\text{Applied} \longrightarrow \text{Resume Analyzed} \longrightarrow \text{Under Review} \longrightarrow \text{Shortlisted} \longrightarrow \text{Interview} \longrightarrow \text{Selected / Rejected}$$
- **Human-in-the-Loop Ethics**: AI provides decision support rather than making autonomous hiring determinations. Candidate evaluations exclude gender, religion, race, and other non-job factors.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Recharts, Axios, Lucide React |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, JWT (python-jose), bcrypt password hashing |
| **Document Parsing** | PyMuPDF (fitz), python-docx, UTF-8 text processing |
| **NLP / AI** | Rule-based semantic matching, partial transferability maps, keyword frequency analysis, explainable ATS algorithms |
| **Database** | PostgreSQL (Production) / SQLite (Development fallback via SQLAlchemy engine abstraction) |
| **Testing** | Pytest, FastAPI TestClient, httpx |
| **Containerization** | Docker, Docker Compose |

---

## 📁 System Architecture & Directory Structure

```
AI-Resume-Recruitment-System/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point, CORS, routers, lifespan
│   │   ├── config.py            # Environment settings (JWT, DB, Uploads)
│   │   ├── database.py          # SQLAlchemy engine, session maker, get_db
│   │   ├── models/              # SQLAlchemy ORM models (users, jobs, resumes, applications)
│   │   ├── schemas/             # Pydantic v2 request/response schemas
│   │   ├── routes/              # RESTful API routers (auth, resumes, jobs, matching, etc.)
│   │   ├── ai/                  # NLP skill extractor, ATS scorer, job matcher, recommender
│   │   ├── services/            # File parser service (PDF, DOCX, TXT)
│   │   ├── security/            # bcrypt hashing, JWT access tokens, role dependencies
│   │   └── utils/               # Database seeder with realistic demo profiles
│   ├── tests/                   # Pytest automated test suites
│   ├── requirements.txt         # Python package dependencies
│   └── .env                     # Backend environment configuration
│
├── src/
│   ├── components/              # ScoreMeter, SkillBadge, StatCard, Navbar, Sidebar
│   ├── context/                 # AuthContext (JWT session state)
│   ├── layouts/                 # ProtectedRoute, CandidateLayout, RecruiterLayout
│   ├── pages/                   # LandingPage, Auth, Candidate and Recruiter dashboards
│   ├── services/                # Axios API service client
│   └── types/                   # TypeScript interfaces
│
├── server.ts                    # Full-stack Node/Express reverse proxy & Vite runner
├── Dockerfile                   # Multi-stage production container image
├── docker-compose.yml           # Multi-container orchestration (App + PostgreSQL)
└── README.md                    # Project documentation
```

---

## 🏁 Quick Start & Local Setup

### Option 1: Docker Compose (Recommended for Production)

Run the full stack with PostgreSQL database:

```bash
docker compose up --build
```

The application will be accessible at `http://localhost:3000`.

---

### Option 2: Running Locally

#### 1. Backend Setup (FastAPI & Python 3.10+)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

#### 2. Frontend & Full-Stack Runner

From the project root directory:

```bash
npm install
npm run dev
```

The unified development server will launch at `http://localhost:3000`.

---

## 🧪 Automated Testing

HireSense AI includes automated test suites covering authentication, PDF/DOCX resume extraction, ATS scoring calculations, and pipeline stage transitions:

```bash
PYTHONPATH=. pytest backend/tests -v
```

All 11 automated test cases pass with 100% success rate.

---

## 🔑 Built-In Demo Credentials

For immediate evaluation and project presentation reviews:

| Role | Email | Password | Preloaded Profile |
|---|---|---|---|
| **Candidate** | `candidate@hiresense.ai` | `Candidate@123` | Alex Rivera (Full Stack Engineer with parsed resume, 82% ATS rating) |
| **Recruiter** | `recruiter@hiresense.ai` | `Recruiter@123` | Sarah Jenkins (Apex Global Technologies, 3 live postings, applicant pipeline) |

New candidate and recruiter accounts can also be created dynamically with validation and bcrypt security.
