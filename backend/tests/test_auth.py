import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
from backend.app.utils.seed_data import seed_database_if_empty

def setup_module(module):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database_if_empty(db)
    db.close()

def test_register_candidate():
    with TestClient(app) as client:
        response = client.post("/api/auth/register", json={
            "full_name": "Test Candidate",
            "email": "testcandidate2@example.com",
            "password": "Password123!",
            "role": "candidate",
            "location": "Boston, MA"
        })
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert data["user"]["role"] == "candidate"

def test_login_candidate_success():
    with TestClient(app) as client:
        response = client.post("/api/auth/login", json={
            "email": "candidate@hiresense.ai",
            "password": "Candidate@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "candidate"

def test_login_invalid_password():
    with TestClient(app) as client:
        response = client.post("/api/auth/login", json={
            "email": "candidate@hiresense.ai",
            "password": "WrongPassword!"
        })
        assert response.status_code == 401

def test_unauthorized_access():
    with TestClient(app) as client:
        response = client.get("/api/auth/me")
        assert response.status_code == 401
