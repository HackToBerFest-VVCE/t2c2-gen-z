from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TaskModel, AuditLogModel, utc_now
from ..schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=list[TaskResponse])
def get_tasks(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TaskModel)
    if category:
        query = query.filter(TaskModel.category == category)
    if priority:
        query = query.filter(TaskModel.priority == priority)
    if status:
        query = query.filter(TaskModel.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (TaskModel.title.ilike(search_filter)) | 
            (TaskModel.description.ilike(search_filter)) |
            (TaskModel.location.ilike(search_filter))
        )
    return query.order_by(TaskModel.created_at.desc()).all()

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("", response_model=TaskResponse, status_code=201)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    task_data = task_in.model_dump()
    if not task_data.get("id"):
        import uuid
        task_data["id"] = str(uuid.uuid4())
    
    if not task_data.get("client_updated_at"):
        task_data["client_updated_at"] = utc_now()

    new_task = TaskModel(**task_data)
    db.add(new_task)
    
    audit = AuditLogModel(
        task_id=new_task.id,
        action="task_created",
        actor=new_task.device_id,
        details=f"Task '{new_task.title}' created on server directly"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    task.revision += 1
    task.updated_at = utc_now()
    
    audit = AuditLogModel(
        task_id=task.id,
        action="task_updated",
        actor="server_admin",
        details=f"Task fields updated: {list(update_data.keys())}"
    )
    db.add(audit)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    audit = AuditLogModel(
        task_id=task_id,
        action="task_deleted",
        actor="server_admin",
        details=f"Task {task_id} deleted"
    )
    db.add(audit)
    db.commit()
    return {"message": "Task deleted successfully", "id": task_id}
