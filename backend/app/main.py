from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.utils.seed_data import seed_database_if_empty
from backend.app.routes import (
    auth_router,
    resumes_router,
    jobs_router,
    matching_router,
    skill_gap_router,
    recommendations_router,
    applications_router,
    candidates_router,
    analytics_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default baseline data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="HireSense AI - Recruitment System API",
    description="Full-stack AI Resume Recruitment System with semantic job matching, explainable ATS scoring, skill gap analysis, and candidate pipeline management.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(resumes_router)
app.include_router(jobs_router)
app.include_router(matching_router)
app.include_router(skill_gap_router)
app.include_router(recommendations_router)
app.include_router(applications_router)
app.include_router(candidates_router)
app.include_router(analytics_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HireSense AI Recruitment System",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
