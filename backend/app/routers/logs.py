from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogOut
from app.services.auth_service import require_admin

router = APIRouter(prefix="/logs", tags=["logs"])

@router.get("/", response_model=List[ActivityLogOut])
def get_activity_logs(
    limit: int = Query(200, ge=1, le=1000),  # Por defecto devuelve los últimos 200 eventos
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Solo el Admin puede acceder aquí. Ordenamos del más reciente al más antiguo.
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()