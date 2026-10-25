import json
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TaskModel, SyncBatchModel, AuditLogModel, utc_now
from ..schemas import (
    SyncPushPayload, SyncPushResponse, SyncPushAckItem,
    SyncPullResponse, TaskResponse
)

router = APIRouter(prefix="/sync", tags=["sync"])

@router.get("/push")
def push_sync_info():
    """Informational endpoint for GET requests to /sync/push. Prevents 405 Method Not Allowed error on browser visits."""
    return {
        "endpoint": "/api/sync/push",
        "supported_method": "POST",
        "description": "Send a JSON payload with { device_id, tasks: [...] } to push offline field tasks.",
        "status": "ready"
    }

@router.post("/push", response_model=SyncPushResponse)
def push_sync_batch(payload: SyncPushPayload, db: Session = Depends(get_db)):
    batch_id = str(uuid.uuid4())
    results: list[SyncPushAckItem] = []
    conflict_count = 0
    now = utc_now()

    try:
        for incoming in payload.tasks:
            task_id = incoming.id or str(uuid.uuid4())
            existing = db.query(TaskModel).filter(TaskModel.id == task_id).first()

            if not existing:
                # Case 1: Fresh task created offline by field agent
                new_task = TaskModel(
                    id=task_id,
                    title=incoming.title,
                    description=incoming.description,
                    category=incoming.category,
                    priority=incoming.priority,
                    status="synced",
                    location=incoming.location,
                    affected_population=incoming.affected_population,
                    confidence_score=incoming.confidence_score,
                    agent_output=incoming.agent_output,
                    verified_evidence=incoming.verified_evidence,
                    device_id=payload.device_id,
                    revision=max(1, incoming.revision),
                    client_updated_at=incoming.client_updated_at or now,
                    created_at=now,
                    updated_at=now
                )
                db.add(new_task)
                db.flush()

                audit = AuditLogModel(
                    task_id=task_id,
                    action="sync_created",
                    actor=f"device:{payload.device_id}",
                    details=f"Task '{new_task.title}' synchronized from offline queue"
                )
                db.add(audit)

                results.append(SyncPushAckItem(
                    task_id=task_id,
                    status="acknowledged",
                    server_revision=new_task.revision,
                    server_timestamp=now,
                    message="Successfully created and persisted on server"
                ))
            else:
                # Case 2: Task already exists on server. Check revisions for conflict
                if incoming.revision > existing.revision:
                    # Client has newer offline edits -> merge onto server
                    existing.title = incoming.title
                    existing.description = incoming.description
                    existing.category = incoming.category
                    existing.priority = incoming.priority
                    existing.status = "synced"
                    existing.location = incoming.location
                    existing.affected_population = incoming.affected_population
                    existing.confidence_score = incoming.confidence_score
                    existing.agent_output = incoming.agent_output
                    existing.verified_evidence = incoming.verified_evidence
                    existing.revision = incoming.revision
                    existing.client_updated_at = incoming.client_updated_at or now
                    existing.updated_at = now
                    db.flush()

                    audit = AuditLogModel(
                        task_id=task_id,
                        action="sync_merged",
                        actor=f"device:{payload.device_id}",
                        details=f"Task '{existing.title}' merged with newer revision {incoming.revision}"
                    )
                    db.add(audit)

                    results.append(SyncPushAckItem(
                        task_id=task_id,
                        status="merged",
                        server_revision=existing.revision,
                        server_timestamp=now,
                        message="Updated and persisted server record with latest offline revision"
                    ))
                elif incoming.revision == existing.revision:
                    # Same revision -> idempotent acknowledgement
                    results.append(SyncPushAckItem(
                        task_id=task_id,
                        status="acknowledged",
                        server_revision=existing.revision,
                        server_timestamp=now,
                        message="Task already up-to-date and persisted on server"
                    ))
                else:
                    # Conflict: Server has revision > incoming revision
                    conflict_count += 1
                    server_task_resp = TaskResponse.model_validate(existing)

                    audit = AuditLogModel(
                        task_id=task_id,
                        action="sync_conflict",
                        actor=f"device:{payload.device_id}",
                        details=f"Conflict on task '{existing.title}': server rev {existing.revision} > client rev {incoming.revision}"
                    )
                    db.add(audit)

                    results.append(SyncPushAckItem(
                        task_id=task_id,
                        status="conflict",
                        server_revision=existing.revision,
                        server_timestamp=now,
                        message=f"Server revision ({existing.revision}) is ahead of client revision ({incoming.revision})",
                        server_task=server_task_resp
                    ))

        # Log sync batch
        batch_status = "conflict" if conflict_count > 0 else "success"
        sync_batch = SyncBatchModel(
            id=batch_id,
            device_id=payload.device_id,
            task_count=len(payload.tasks),
            pushed_at=now,
            status=batch_status,
            details=json.dumps({
                "total": len(payload.tasks),
                "conflicts": conflict_count,
                "acknowledged": len([r for r in results if r.status in ["acknowledged", "merged"]])
            })
        )
        db.add(sync_batch)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to persist sync batch to database: {str(exc)}"
        )

    return SyncPushResponse(
        batch_id=batch_id,
        status=batch_status,
        processed_count=len(payload.tasks),
        results=results
    )

@router.get("/pull", response_model=SyncPullResponse)
def pull_tasks(
    since: Optional[datetime] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(TaskModel)
    if since:
        query = query.filter(TaskModel.updated_at > since)
    
    tasks = query.order_by(TaskModel.updated_at.desc()).limit(limit).all()
    server_now = utc_now()
    
    return SyncPullResponse(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        server_timestamp=server_now,
        total_count=len(tasks)
    )

@router.get("/batches", response_model=list[dict])
def get_sync_batches(limit: int = 20, db: Session = Depends(get_db)):
    batches = db.query(SyncBatchModel).order_by(SyncBatchModel.pushed_at.desc()).limit(limit).all()
    out = []
    for b in batches:
        out.append({
            "id": b.id,
            "device_id": b.device_id,
            "task_count": b.task_count,
            "pushed_at": b.pushed_at,
            "status": b.status,
            "details": json.loads(b.details) if b.details else {}
        })
    return out
