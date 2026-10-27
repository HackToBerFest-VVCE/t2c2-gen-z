import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import settings
from ..models import ReportModel, ReportAttachmentModel, utc_now
from ..schemas import ReportCreate, ReportUpdate, ReportResponse, ReportAttachmentResponse

router = APIRouter(prefix="/reports", tags=["reports"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

def build_report_response(report: ReportModel, db: Session) -> ReportResponse:
    attachments = db.query(ReportAttachmentModel).filter(
        ReportAttachmentModel.report_id == report.id
    ).all()
    
    att_responses = []
    for att in attachments:
        att_responses.append(ReportAttachmentResponse(
            id=att.id,
            report_id=att.report_id,
            filename=att.filename,
            original_name=att.original_name,
            mime_type=att.mime_type,
            size_bytes=att.size_bytes,
            created_at=att.created_at,
            url=f"{settings.API_PREFIX}/reports/{report.id}/attachments/{att.id}"
        ))
    
    resp = ReportResponse.model_validate(report)
    resp.attachments = att_responses
    return resp

@router.post("", response_model=ReportResponse, status_code=201)
def create_or_upsert_report(payload: ReportCreate, db: Session = Depends(get_db)):
    report_id = payload.id or str(uuid.uuid4())
    existing = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    now = utc_now()

    if existing:
        # Idempotent upsert
        if payload.revision >= existing.revision:
            existing.title = payload.title
            existing.description = payload.description
            existing.category = payload.category
            existing.severity = payload.severity
            existing.latitude = payload.latitude
            existing.longitude = payload.longitude
            existing.location_name = payload.location_name
            existing.worker_id = payload.worker_id
            existing.notes = payload.notes
            existing.ai_summary = payload.ai_summary
            existing.ai_status = payload.ai_status
            existing.revision = payload.revision
            existing.updated_at = now
            db.commit()
            db.refresh(existing)
        return build_report_response(existing, db)

    # Fresh report
    new_report = ReportModel(
        id=report_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_name=payload.location_name,
        worker_id=payload.worker_id,
        notes=payload.notes,
        ai_summary=payload.ai_summary,
        ai_status=payload.ai_status,
        sync_status="synced",
        revision=payload.revision,
        created_at=payload.created_at or now,
        updated_at=now
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return build_report_response(new_report, db)

@router.get("", response_model=list[ReportResponse])
def list_reports(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(ReportModel)
    if category:
        query = query.filter(ReportModel.category == category)
    if severity:
        query = query.filter(ReportModel.severity == severity)
    
    reports = query.order_by(ReportModel.created_at.desc()).limit(limit).all()
    return [build_report_response(r, db) for r in reports]

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report with id '{report_id}' not found")
    return build_report_response(report, db)

@router.post("/{report_id}/attachments", response_model=ReportAttachmentResponse, status_code=201)
async def upload_attachment(
    report_id: str,
    file: UploadFile = File(...),
    attachment_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Verify parent report exists
    report = db.query(ReportModel).filter(ReportModel.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Parent report '{report_id}' not found")

    # Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{content_type}'. Supported types: JPEG, PNG, WebP."
        )

    # Read content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 10MB ({len(content)} bytes)."
        )

    att_id = attachment_id or str(uuid.uuid4())
    existing_att = db.query(ReportAttachmentModel).filter(ReportAttachmentModel.id == att_id).first()
    
    # Safe server-generated filename
    ext = ".jpg"
    if "png" in content_type:
        ext = ".png"
    elif "webp" in content_type:
        ext = ".webp"
    
    safe_filename = f"{report_id}_{att_id}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    if existing_att:
        existing_att.size_bytes = len(content)
        existing_att.storage_path = dest_path
        existing_att.mime_type = content_type
        db.commit()
        db.refresh(existing_att)
        att_record = existing_att
    else:
        att_record = ReportAttachmentModel(
            id=att_id,
            report_id=report_id,
            filename=safe_filename,
            original_name=file.filename or safe_filename,
            mime_type=content_type,
            size_bytes=len(content),
            storage_path=dest_path,
            created_at=utc_now()
        )
        db.add(att_record)
        db.commit()
        db.refresh(att_record)

    return ReportAttachmentResponse(
        id=att_record.id,
        report_id=att_record.report_id,
        filename=att_record.filename,
        original_name=att_record.original_name,
        mime_type=att_record.mime_type,
        size_bytes=att_record.size_bytes,
        created_at=att_record.created_at,
        url=f"{settings.API_PREFIX}/reports/{report_id}/attachments/{att_record.id}"
    )

@router.get("/{report_id}/attachments/{attachment_id}")
def get_attachment_file(report_id: str, attachment_id: str, db: Session = Depends(get_db)):
    att = db.query(ReportAttachmentModel).filter(
        ReportAttachmentModel.id == attachment_id,
        ReportAttachmentModel.report_id == report_id
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not os.path.exists(att.storage_path):
        raise HTTPException(status_code=404, detail="Attachment file not found on disk")

    return FileResponse(
        path=att.storage_path,
        media_type=att.mime_type,
        filename=att.original_name
    )
