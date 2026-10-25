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

def test_sync_push_get_endpoint_info():
    """Verify that sending a GET request to /api/sync/push returns 200 with documentation info, not 405 Method Not Allowed."""
    response = client.get("/api/sync/push")
    assert response.status_code == 200
    data = response.json()
    assert data["endpoint"] == "/api/sync/push"
    assert data["supported_method"] == "POST"

def test_sync_push_dual_prefix_routing():
    """Verify that both /api/sync/push and /sync/push resolve to the handler (critical for Vercel prefix stripping rewrites)."""
    task_id = str(uuid.uuid4())
    payload = {
        "device_id": "dual-prefix-tester",
        "tasks": [
            {
                "id": task_id,
                "title": "Borewell Contamination Check",
                "description": "Turbidity test required.",
                "category": "water_supply",
                "priority": "medium"
            }
        ]
    }
    # Direct /sync/push route
    res = client.post("/sync/push", json=payload)
    assert res.status_code == 200
    assert res.json()["results"][0]["task_id"] == task_id

def test_sync_push_with_raw_dict_agent_output():
    """Verify that agent_output passed as raw dictionary object is automatically serialized and persisted."""
    task_id = str(uuid.uuid4())
    payload = {
        "device_id": "dict-agent-node",
        "tasks": [
            {
                "id": task_id,
                "title": "Solar Water Filter Pump",
                "description": "Filter pump clogged with sand.",
                "category": "water_supply",
                "priority": "high",
                "agent_output": {
                    "summary": "Sand clog in water pump",
                    "actions": [{"id": "act-1", "title": "Clean filter"}]
                }
            }
        ]
    }
    res = client.post("/api/sync/push", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["results"][0]["task_id"] == task_id

    # Verify persisted in database
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 200
    assert "Clean filter" in get_res.json()["agent_output"]

def test_sync_push_validation_error():
    """Verify proper 422 Unprocessable Entity error when required fields are missing."""
    invalid_payload = {
        "device_id": "missing-tasks-node"
        # 'tasks' field is omitted
    }
    res = client.post("/api/sync/push", json=invalid_payload)
    assert res.status_code == 422

def test_sync_push_empty_tasks():
    """Verify graceful handling when tasks list is empty."""
    res = client.post("/api/sync/push", json={"device_id": "empty-node", "tasks": []})
    assert res.status_code == 200
    assert res.json()["processed_count"] == 0
