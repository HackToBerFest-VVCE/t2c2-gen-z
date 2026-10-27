import json
import uuid
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .models import TaskModel, ReportModel, AuditLogModel, utc_now
from .routers import tasks, sync, telemetry, reports, ai

from sqlalchemy import text

# Create tables
Base.metadata.create_all(bind=engine)

# Safe SQLite schema migration for added columns
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE reports ADD COLUMN original_language VARCHAR(32) DEFAULT 'en'"))
        conn.commit()
    except Exception:
        pass

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Offline-First Autonomous Agent System Backend API"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(tasks.router, prefix=settings.API_PREFIX)
app.include_router(sync.router, prefix=settings.API_PREFIX)
app.include_router(telemetry.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)

# Also mount under root to handle Vercel rewrite prefix variations
app.include_router(tasks.router)
app.include_router(sync.router)
app.include_router(telemetry.router)
app.include_router(reports.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX
    }

@app.get(f"{settings.API_PREFIX}/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "server_time": utc_now().isoformat(),
        "database": "sqlite_connected" if "sqlite" in settings.DATABASE_URL else "db_connected",
        "version": settings.VERSION
    }

def seed_demo_data():
    db = SessionLocal()
    try:
        count = db.query(TaskModel).count()
        if count == 0:
            demo_task_id = "demo-handpump-001"
            handpump_agent_output = {
                "category": "water_supply",
                "priority": "critical",
                "confidence_score": 0.94,
                "summary": "Hand pump failure near village primary school impacting ~40 dependent families.",
                "location": "Near Village Primary School, Sector 2",
                "affected_population": 40,
                "actions": [
                    {
                        "id": "act-1",
                        "title": "Dispatch District Mechanical Team",
                        "description": "Notify Block Development Water Works engineer for cylinder replacement.",
                        "target_role": "Water Works Engineer",
                        "urgency": "immediate",
                        "completed": False
                    },
                    {
                        "id": "act-2",
                        "title": "Deploy Emergency Potable Tanker",
                        "description": "Request 3,000L water tanker for the 40 affected school and neighborhood families.",
                        "target_role": "Panchayat Secretary",
                        "urgency": "high",
                        "completed": False
                    },
                    {
                        "id": "act-3",
                        "title": "Site Inspection & Borewell Depth Test",
                        "description": "Inspect hand pump handle chain, seal leakages, and static groundwater level.",
                        "target_role": "Field Technical Officer",
                        "urgency": "medium",
                        "completed": False
                    }
                ],
                "reasoning": [
                    "Detected keywords: 'hand pump', 'stopped working', 'primary school', '40 families'.",
                    "Category classified as 'water_supply' with 94% heuristic confidence.",
                    "Priority elevated to 'critical' due to direct threat to children at primary school and high dependent density (40 households).",
                    "Zero verified evidence yet of physical repair; human verification mandatory."
                ],
                "needs_human_verification": True,
                "verified_evidence": False,
                "model_name": "FieldPilot Deterministic Rule Engine v1"
            }

            task = TaskModel(
                id=demo_task_id,
                title="Hand pump failure near Village Primary School",
                description="The hand pump near the village primary school has stopped working. Around 40 families depend on it.",
                category="water_supply",
                priority="critical",
                status="synced",
                location="Village Primary School, Sector 2",
                affected_population=40,
                confidence_score=0.94,
                agent_output=json.dumps(handpump_agent_output),
                verified_evidence=False,
                device_id="node-field-01",
                revision=1,
                client_updated_at=utc_now()
            )
            db.add(task)

            audit = AuditLogModel(
                task_id=demo_task_id,
                action="seed_created",
                actor="system_initializer",
                details="Initial verified benchmark demo task seeded on backend"
            )
            db.add(audit)
            db.commit()

        # Seed sample field inspection report if empty
        report_count = db.query(ReportModel).count()
        if report_count == 0:
            demo_report_id = "report-demo-bund-001"
            sample_report = ReportModel(
                id=demo_report_id,
                title="Panchayat Irrigation Canal Embankment Breach",
                description="Heavy runoff caused a 4-meter breach in the north distributary canal bund. Water flooding adjacent arecanut plantation and submerging pathway.",
                category="agriculture",
                severity="high",
                latitude=12.9716,
                longitude=77.5946,
                location_name="North Distributary Canal Bund, Channapatna Sector",
                worker_id="field-officer-karnataka-01",
                notes="Sandbags required immediately to prevent further soil erosion.",
                ai_summary="High severity irrigation canal breach threatening adjacent plantation; requires emergency sandbag reinforcement.",
                ai_status="completed",
                sync_status="synced",
                revision=1,
                created_at=utc_now()
            )
            db.add(sample_report)
            db.commit()
    finally:
        db.close()

seed_demo_data()
