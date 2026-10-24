import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_sync_push_new_offline_task():
    task_id = str(uuid.uuid4())
    sync_payload = {
        "device_id": "test-device-offline-01",
        "tasks": [
            {
                "id": task_id,
                "title": "Sub-center Solar Refrigerator Inverter Tripped",
                "description": "Medicine storage fridge at Sub-Center 3 has no power. Temperatures rising.",
                "category": "healthcare",
                "priority": "critical",
                "status": "completed_local",
                "location": "Sub-Center 3, East Hamlet",
                "affected_population": 120,
                "confidence_score": 0.96,
                "verified_evidence": False,
                "device_id": "test-device-offline-01",
                "revision": 1
            }
        ]
    }
    
    response = client.post("/api/sync/push", json=sync_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["processed_count"] == 1
    assert data["results"][0]["task_id"] == task_id
    assert data["results"][0]["status"] == "acknowledged"

def test_sync_push_merge_newer_revision():
    task_id = str(uuid.uuid4())
    # 1. First push revision 1
    first_payload = {
        "device_id": "test-device-02",
        "tasks": [
            {
                "id": task_id,
                "title": "Culvert silt blockage",
                "description": "Culvert blocked with leaves.",
                "category": "infrastructure",
                "priority": "medium",
                "status": "completed_local",
                "location": "Road Marker 12",
                "affected_population": 10,
                "confidence_score": 0.75,
                "revision": 1
            }
        ]
    }
    client.post("/api/sync/push", json=first_payload)

    # 2. Push revision 2 (newer offline edit by field officer)
    second_payload = {
        "device_id": "test-device-02",
        "tasks": [
            {
                "id": task_id,
                "title": "Culvert silt blockage - Severe Overflow",
                "description": "Culvert completely blocked by storm debris. Water overflowing onto access road.",
                "category": "infrastructure",
                "priority": "high",
                "status": "completed_local",
                "location": "Road Marker 12",
                "affected_population": 50,
                "confidence_score": 0.91,
                "revision": 2
            }
        ]
    }
    res2 = client.post("/api/sync/push", json=second_payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["results"][0]["status"] == "merged"
    assert data2["results"][0]["server_revision"] == 2

def test_sync_push_conflict_detection():
    task_id = str(uuid.uuid4())
    # Create task on server directly, giving it rev 2 via PATCH
    create_res = client.post("/api/tasks", json={
        "id": task_id,
        "title": "Panchayat Hall Roof Leak",
        "description": "Water leaking through ceiling.",
        "category": "infrastructure",
        "priority": "medium",
        "revision": 1
    })
    assert create_res.status_code == 201

    # Update on server (revision becomes 2)
    client.patch(f"/api/tasks/{task_id}", json={"priority": "high"})

    # Now a stale offline client tries to push revision 1
    stale_payload = {
        "device_id": "stale-node-99",
        "tasks": [
            {
                "id": task_id,
                "title": "Panchayat Hall Roof Leak (Stale Offline Draft)",
                "description": "Water leaking through ceiling.",
                "category": "infrastructure",
                "priority": "low",
                "revision": 1
            }
        ]
    }
    res = client.post("/api/sync/push", json=stale_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "conflict"
    assert data["results"][0]["status"] == "conflict"
    assert "ahead" in data["results"][0]["message"]
    assert data["results"][0]["server_task"]["priority"] == "high"

def test_sync_pull():
    response = client.get("/api/sync/pull")
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data
    assert "server_timestamp" in data
    assert data["total_count"] > 0
