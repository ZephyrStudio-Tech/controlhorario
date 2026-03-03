from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogOut
from app.services.auth_service import require_admin
from app.models.user import User
from app.services.log_service import log_activity
from app.services.session_service import get_client_ip

router = APIRouter(prefix="/logs", tags=["logs"])

# Fíjate que ahora es get("") y no get("/")
@router.get("", response_model=List[ActivityLogOut])
def get_activity_logs(
    request: Request,
    limit: int = Query(300),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    log_activity(
        db, 
        "AUDIT_VIEW", 
        "El administrador visualiza los logs", 
        current_user.id, 
        get_client_ip(request)
    )
    
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
