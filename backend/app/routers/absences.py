import uuid
from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.absence import Absence, AusenciaEstadoEnum
from app.schemas.absence import AbsenceCreate, AbsenceReview, AbsenceOut
from app.services.auth_service import get_current_user, require_admin_or_rrhh

router = APIRouter(prefix="/absences", tags=["absences"])


def _check_overlap(
    db: Session,
    user_id: uuid.UUID,
    fecha_inicio: date,
    fecha_fin: date,
    exclude_id: Optional[uuid.UUID] = None,
):
    q = db.query(Absence).filter(
        Absence.user_id == user_id,
        Absence.estado != AusenciaEstadoEnum.denegada,
        Absence.fecha_inicio <= fecha_fin,
        Absence.fecha_fin >= fecha_inicio,
    )
    if exclude_id:
        q = q.filter(Absence.id != exclude_id)
    return q.first()


@router.post("/", response_model=AbsenceOut, status_code=status.HTTP_201_CREATED)
def create_absence(
    payload: AbsenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.fecha_fin < payload.fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "INVALID_DATES", "message": "La fecha de fin debe ser posterior a la de inicio"},
        )
    overlap = _check_overlap(db, current_user.id, payload.fecha_inicio, payload.fecha_fin)
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": True, "code": "ABSENCE_OVERLAP", "message": "Ya tienes una ausencia en ese rango de fechas"},
        )
    absence = Absence(
        user_id=current_user.id,
        tipo=payload.tipo,
        fecha_inicio=payload.fecha_inicio,
        fecha_fin=payload.fecha_fin,
        comentario_trabajador=payload.comentario_trabajador,
    )
    db.add(absence)
    db.commit()
    db.refresh(absence)
    return absence


@router.get("/my", response_model=List[AbsenceOut])
def get_my_absences(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Absence).filter(Absence.user_id == current_user.id)
    if start_date:
        q = q.filter(Absence.fecha_fin >= start_date)
    if end_date:
        q = q.filter(Absence.fecha_inicio <= end_date)
    return q.order_by(Absence.fecha_inicio.desc()).all()


@router.get("/all", response_model=List[AbsenceOut])
def get_all_absences(
    user_id: Optional[uuid.UUID] = Query(None),
    estado: Optional[AusenciaEstadoEnum] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    q = db.query(Absence)
    if user_id:
        q = q.filter(Absence.user_id == user_id)
    if estado:
        q = q.filter(Absence.estado == estado)
    if start_date:
        q = q.filter(Absence.fecha_fin >= start_date)
    if end_date:
        q = q.filter(Absence.fecha_inicio <= end_date)
    return q.order_by(Absence.created_at.desc()).all()


@router.patch("/{absence_id}/review", response_model=AbsenceOut)
def review_absence(
    absence_id: uuid.UUID,
    payload: AbsenceReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    absence = db.query(Absence).filter(Absence.id == absence_id).first()
    if not absence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "ABSENCE_NOT_FOUND", "message": "Ausencia no encontrada"},
        )
    if absence.estado != AusenciaEstadoEnum.pendiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "ALREADY_REVIEWED", "message": "Esta solicitud ya fue revisada"},
        )
    if payload.estado == AusenciaEstadoEnum.denegada and not payload.comentario_rrhh:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "COMMENT_REQUIRED", "message": "Se requiere un comentario para denegar una solicitud"},
        )
    absence.estado = payload.estado
    absence.comentario_rrhh = payload.comentario_rrhh
    absence.revisado_por = current_user.id
    absence.fecha_revision = datetime.now(timezone.utc)
    db.commit()
    db.refresh(absence)
    return absence


@router.get("/pending/count")
def pending_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    count = db.query(Absence).filter(Absence.estado == AusenciaEstadoEnum.pendiente).count()
    return {"count": count}