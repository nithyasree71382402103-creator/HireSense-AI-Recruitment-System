import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_list_jobs_public():
    res = client.get("/api/jobs")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_candidate_comparison_endpoint():
    # Public compare or endpoint structure
    res = client.post("/api/matching/compare", json={"candidate_ids": [1], "job_id": 1})
    assert res.status_code in [200, 404]
