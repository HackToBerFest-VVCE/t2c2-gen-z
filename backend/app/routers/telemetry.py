from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import DeviceTelemetryModel, AuditLogModel
from ..schemas import DeviceTelemetryPayload, AuditLogResponse

router = APIRouter(prefix="", tags=["telemetry_and_audit"])

@router.post("/telemetry", response_model=dict)
def report_telemetry(payload: DeviceTelemetryPayload, db: Session = Depends(get_db)):
    existing = db.query(DeviceTelemetryModel).filter(
        DeviceTelemetryModel.device_id == payload.device_id
    ).first()

    now = datetime.utcnow()
    if existing:
        existing.battery_level = payload.battery_level
        existing.is_charging = payload.is_charging
        existing.storage_used_bytes = payload.storage_used_bytes
        existing.storage_total_bytes = payload.storage_total_bytes
        existing.pending_outbox_count = payload.pending_outbox_count
        existing.last_seen = now
    else:
        new_telem = DeviceTelemetryModel(
            device_id=payload.device_id,
            battery_level=payload.battery_level,
            is_charging=payload.is_charging,
            storage_used_bytes=payload.storage_used_bytes,
            storage_total_bytes=payload.storage_total_bytes,
            pending_outbox_count=payload.pending_outbox_count,
            last_seen=now
        )
        db.add(new_telem)
    
    db.commit()
    return {"status": "ok", "recorded_at": now}

@router.get("/telemetry", response_model=list[dict])
def list_telemetry(db: Session = Depends(get_db)):
    items = db.query(DeviceTelemetryModel).order_by(DeviceTelemetryModel.last_seen.desc()).all()
    return [
        {
            "device_id": item.device_id,
            "battery_level": item.battery_level,
            "is_charging": item.is_charging,
            "storage_used_bytes": item.storage_used_bytes,
            "storage_total_bytes": item.storage_total_bytes,
            "pending_outbox_count": item.pending_outbox_count,
            "last_seen": item.last_seen
        }
        for item in items
    ]

@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(default=50, le=200),
    task_id: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLogModel)
    if task_id:
        query = query.filter(AuditLogModel.task_id == task_id)
    logs = query.order_by(AuditLogModel.timestamp.desc()).limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]
