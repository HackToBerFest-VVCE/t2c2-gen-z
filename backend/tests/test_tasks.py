import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "sqlite" in data["database"]

def test_create_and_get_task():
    task_payload = {
        "title": "Irrigation Canal Breached",
        "description": "Minor leak spotted along north embankment canal.",
        "category": "agriculture",
        "priority": "high",
        "status": "completed_local",
        "location": "North Canal Gate 4",
        "affected_population": 25,
        "confidence_score": 0.88,
        "device_id": "field-device-test-1",
        "revision": 1
    }
    create_res = client.post("/api/tasks", json=task_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["title"] == task_payload["title"]
    assert created["category"] == "agriculture"
    task_id = created["id"]

    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == task_id
