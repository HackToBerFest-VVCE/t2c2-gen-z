import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime
from .database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False, default="general")
    priority = Column(String(32), nullable=False, default="medium")
    status = Column(String(32), nullable=False, default="completed_local")
    location = Column(String(255), nullable=True, default="")
    affected_population = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)
    agent_output = Column(Text, nullable=True)  # JSON-encoded agent reasoning and actions
    verified_evidence = Column(Boolean, default=False)
    device_id = Column(String(64), nullable=False, default="device-default")
    revision = Column(Integer, default=1)
    client_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class SyncBatchModel(Base):
    __tablename__ = "sync_batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(64), nullable=False)
    task_count = Column(Integer, default=0)
    pushed_at = Column(DateTime, default=utc_now)
    status = Column(String(32), default="success")  # success, conflict, partial
    details = Column(Text, nullable=True)  # JSON-encoded summary

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), nullable=True)
    action = Column(String(64), nullable=False)
    actor = Column(String(64), nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now)

class DeviceTelemetryModel(Base):
    __tablename__ = "device_telemetry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(64), unique=True, nullable=False)
    battery_level = Column(Float, default=1.0)
    is_charging = Column(Boolean, default=False)
    storage_used_bytes = Column(Integer, default=0)
    storage_total_bytes = Column(Integer, default=0)
    pending_outbox_count = Column(Integer, default=0)
    last_seen = Column(DateTime, default=utc_now)

class ReportModel(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False, default="infrastructure")
    severity = Column(String(32), nullable=False, default="medium")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True, default="")
    worker_id = Column(String(64), nullable=False, default="field-worker-01")
    notes = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_status = Column(String(32), nullable=False, default="not_requested")
    sync_status = Column(String(32), nullable=False, default="synced")
    revision = Column(Integer, default=1)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class ReportAttachmentModel(Base):
    __tablename__ = "report_attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), nullable=False)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    mime_type = Column(String(64), nullable=False)
    size_bytes = Column(Integer, default=0)
    storage_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now)
