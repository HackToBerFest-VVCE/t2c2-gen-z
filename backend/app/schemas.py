import json
from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AgentActionItem(BaseModel):
    id: str
    title: str
    description: str
    target_role: str
    urgency: str
    completed: bool = False

class AgentOutputPayload(BaseModel):
    category: str
    priority: str
    confidence_score: float
    summary: str
    location: Optional[str] = None
    affected_population: int = 0
    actions: list[AgentActionItem] = []
    reasoning: list[str] = []
    needs_human_verification: bool = True
    verified_evidence: bool = False
    model_name: str = "fieldpilot-heuristic-v1"

class TaskBase(BaseModel):
    title: str
    description: str
    category: str = "water_supply"
    priority: str = "medium"
    status: str = "completed_local"
    location: Optional[str] = ""
    affected_population: int = 0
    confidence_score: float = 0.0
    agent_output: Optional[str] = None
    verified_evidence: bool = False
    device_id: str = "device-default"
    revision: int = 1

    @field_validator('agent_output', mode='before')
    @classmethod
    def serialize_agent_output(cls, v):
        if isinstance(v, (dict, list)):
            return json.dumps(v)
        return v

class TaskCreate(TaskBase):
    id: Optional[str] = None
    client_updated_at: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    affected_population: Optional[int] = None
    confidence_score: Optional[float] = None
    agent_output: Optional[str] = None
    verified_evidence: Optional[bool] = None
    revision: Optional[int] = None
    client_updated_at: Optional[datetime] = None

    @field_validator('agent_output', mode='before')
    @classmethod
    def serialize_agent_output_update(cls, v):
        if isinstance(v, (dict, list)):
            return json.dumps(v)
        return v

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    client_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class SyncPushAckItem(BaseModel):
    task_id: str
    status: str  # "acknowledged", "merged", "conflict"
    server_revision: int
    server_timestamp: datetime
    message: Optional[str] = None
    server_task: Optional[TaskResponse] = None

class SyncPushPayload(BaseModel):
    device_id: str
    tasks: list[TaskCreate]
    client_timestamp: datetime = Field(default_factory=utc_now)

class SyncPushResponse(BaseModel):
    batch_id: str
    status: str
    processed_count: int
    results: list[SyncPushAckItem]

class SyncPullResponse(BaseModel):
    tasks: list[TaskResponse]
    server_timestamp: datetime
    total_count: int

class DeviceTelemetryPayload(BaseModel):
    device_id: str
    battery_level: float = 1.0
    is_charging: bool = False
    storage_used_bytes: int = 0
    storage_total_bytes: int = 0
    pending_outbox_count: int = 0

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: Optional[str] = None
    action: str
    actor: str
    details: str
    timestamp: datetime

# Field Report Schemas
class ReportAttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    report_id: str
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime
    url: Optional[str] = None

class ReportBase(BaseModel):
    title: str
    description: str
    category: str = "infrastructure"
    severity: str = "medium"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = ""
    worker_id: str = "field-worker-01"
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_status: str = "not_requested"
    revision: int = 1

class ReportCreate(ReportBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    worker_id: Optional[str] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_status: Optional[str] = None
    revision: Optional[int] = None

class ReportResponse(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sync_status: str
    created_at: datetime
    updated_at: datetime
    attachments: list[ReportAttachmentResponse] = []

# AI Schemas
class AIChatMessage(BaseModel):
    role: str  # 'user' | 'model' | 'system'
    content: str

class AIChatRequest(BaseModel):
    prompt: str
    language: str = "kn-IN"  # Default Kannada
    history: list[AIChatMessage] = []
    mode: str = "hybrid"  # 'online' | 'hybrid' | 'strict_offline'
    context_data: Optional[dict[str, Any]] = None

class AIChatResponse(BaseModel):
    reply: str
    language: str
    provider_used: str  # 'gemini' | 'local_knowledge' | 'offline_rule'
    execution_mode: str
    suggested_follow_ups: list[str] = []
    verified_sources: list[str] = []
    error: Optional[str] = None

class AIReportAnalysisRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
    language: str = "en"
    mode: str = "hybrid"

class AIReportAnalysisResponse(BaseModel):
    summary: str
    suggested_category: str
    suggested_severity: str
    missing_information: list[str] = []
    supervisor_notes: str
    confidence_score: float = 0.85
    provider_used: str
