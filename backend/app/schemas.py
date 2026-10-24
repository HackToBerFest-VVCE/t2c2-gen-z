from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict

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
