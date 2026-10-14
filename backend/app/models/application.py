import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    
    # Pipeline stages: Applied -> Resume Analyzed -> Under Review -> Shortlisted -> Interview -> Selected / Rejected
    status = Column(String(50), default="Applied")
    match_score = Column(Float, default=0.0)
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    status_updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    candidate = relationship("CandidateProfile", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")

class CandidateScore(Base):
    __tablename__ = "candidate_scores"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    overall_match_percentage = Column(Float, default=0.0)
    matched_skills = Column(JSON, nullable=True)     # list of strings
    partial_skills = Column(JSON, nullable=True)     # list of {from, to, weight}
    missing_skills = Column(JSON, nullable=True)     # list of strings
    score_breakdown = Column(JSON, nullable=True)    # dict with skill, exp, edu breakdown
    match_explanation = Column(JSON, nullable=True)  # dict with strong, partial, missing points
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("Job", back_populates="candidate_scores")

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    strong_skills = Column(JSON, nullable=True)       # possessed
    missing_skills = Column(JSON, nullable=True)      # required missing
    improvement_areas = Column(JSON, nullable=True)   # partial matches
    analysis_date = Column(DateTime, default=datetime.datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True)
    skill_name = Column(String(100), nullable=False)
    course_name = Column(String(255), nullable=False)
    platform = Column(String(100), default="Online Learning")
    reason = Column(Text, nullable=False)
    difficulty = Column(String(50), default="Intermediate")  # Beginner, Intermediate, Advanced
    priority = Column(String(50), default="High")            # High, Medium, Low
    learning_order = Column(Integer, default=1)
    url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
