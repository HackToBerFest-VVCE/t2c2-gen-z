import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_ai_status():
    res = client.get("/api/ai/status")
    assert res.status_code == 200
    data = res.json()
    assert "provider" in data
    assert "gemini_configured" in data
    assert len(data["supported_languages"]) >= 25
    assert data["supported_languages"][0]["code"] == "kn-IN"

def test_ai_chat_strict_offline():
    payload = {
        "prompt": "How to treat Koleroga disease in arecanut?",
        "language": "kn-IN",
        "mode": "strict_offline"
    }
    res = client.post("/api/ai/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["execution_mode"] == "strict_offline"
    assert data["provider_used"] in ["local_knowledge", "offline_rule"]
    assert "Bordeaux mixture" in data["reply"] or "ಅಡಿಕೆ" in data["reply"] or "Offline" in data["reply"]

def test_ai_chat_multilingual_fallback():
    # Test Hindi, Urdu, Spanish, and English fallbacks
    for lang in ["hi-IN", "ur-IN", "es-ES", "en-US"]:
        payload = {
            "prompt": "General crop query",
            "language": lang,
            "mode": "hybrid"
        }
        res = client.post("/api/ai/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["language"] == lang
        assert len(data["reply"]) > 5

def test_ai_analyze_report_offline():
    payload = {
        "title": "Severe pipe leakage near primary school water tank",
        "description": "Drinking water pipeline broke this morning, flood water accumulating near classroom.",
        "category": "water_supply",
        "severity": "high",
        "mode": "strict_offline"
    }
    res = client.post("/api/ai/analyze-report", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_category"] == "water_supply"
    assert data["suggested_severity"] in ["high", "critical"]
    assert len(data["summary"]) > 10

def test_create_and_fetch_field_report_with_attachment():
    # 1. Create Report
    report_data = {
        "title": "Hospital Access Road Culvert Collapsed",
        "description": "Culvert collapsed due to flash rains, ambulance pathway obstructed.",
        "category": "infrastructure",
        "severity": "critical",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "location_name": "Rural Hospital Approach Road, Sector 3",
        "worker_id": "worker-tamilnadu-04",
        "notes": "Emergency detour sign posted.",
        "revision": 1
    }
    create_res = client.post("/api/reports", json=report_data)
    assert create_res.status_code == 201
    created_report = create_res.json()
    report_id = created_report["id"]
    assert created_report["title"] == report_data["title"]
    assert created_report["severity"] == "critical"

    # 2. Upload Photo Attachment
    file_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00" + (b"\x00" * 100) # minimal JPEG header
    files = {
        "file": ("culvert_damage.jpg", io.BytesIO(file_content), "image/jpeg")
    }
    att_res = client.post(f"/api/reports/{report_id}/attachments", files=files)
    assert att_res.status_code == 201
    att_data = att_res.json()
    assert att_data["report_id"] == report_id
    assert att_data["mime_type"] == "image/jpeg"
    attachment_id = att_data["id"]

    # 3. Retrieve Report with Attachment included
    get_res = client.get(f"/api/reports/{report_id}")
    assert get_res.status_code == 200
    fetched = get_res.json()
    assert len(fetched["attachments"]) == 1
    assert fetched["attachments"][0]["id"] == attachment_id

    # 4. Download Attachment File
    download_res = client.get(f"/api/reports/{report_id}/attachments/{attachment_id}")
    assert download_res.status_code == 200
    assert download_res.content == file_content

def test_attachment_invalid_mime_type_rejected():
    report_data = {
        "title": "Test Report",
        "description": "Test description",
        "category": "other",
        "severity": "low"
    }
    create_res = client.post("/api/reports", json=report_data)
    report_id = create_res.json()["id"]

    files = {
        "file": ("malicious.exe", io.BytesIO(b"MZ\x90\x00"), "application/x-msdownload")
    }
    att_res = client.post(f"/api/reports/{report_id}/attachments", files=files)
    assert att_res.status_code == 400
    assert "Invalid file type" in att_res.json()["detail"]
