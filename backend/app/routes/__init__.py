from backend.app.routes.auth import router as auth_router
from backend.app.routes.resumes import router as resumes_router
from backend.app.routes.jobs import router as jobs_router
from backend.app.routes.matching import router as matching_router
from backend.app.routes.skill_gap import router as skill_gap_router
from backend.app.routes.recommendations import router as recommendations_router
from backend.app.routes.applications import router as applications_router
from backend.app.routes.candidates import router as candidates_router
from backend.app.routes.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "resumes_router",
    "jobs_router",
    "matching_router",
    "skill_gap_router",
    "recommendations_router",
    "applications_router",
    "candidates_router",
    "analytics_router",
]
