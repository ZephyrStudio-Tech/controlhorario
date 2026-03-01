from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.absence import Absence, AusenciaEstadoEnum
from app.schemas.absence import AbsenceCreate, AbsenceReview
import uuid
from datetime import date, datetime, timezone


def check_overlap(
    db: Session,
    user_id: uuid.UUID,
    fecha_inicio: date,
    fecha_fin: date,
    exclude_id: uuid.UUID | None = None,
) -> Absence | None:
    """Devuelve la primera ausencia solapada si existe, o None."""
    q = db.query(Absence).filter(
        Absence.user_id == user_id,
        Absence.estado != AusenciaEstadoEnum.denegada,
        Absence.fecha_inicio <= fecha_fin,
        Absence.fecha_fin >= fecha_inicio,
    )
    if exclude_id:
        q = q.filter(Absence.id != exclude_id)
    return q.first()


def create_absence(db: Session, user_id: uuid.UUID, data: AbsenceCreate) -> Absence:
    if data.fecha_fin < data.fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "INVALID_DATES", "message": "La fecha de fin debe ser posterior a la de inicio"},
        )
    overlap = check_overlap(db, user_id, data.fecha_inicio, data.fecha_fin)
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": True, "code": "ABSENCE_OVERLAP", "message": "Ya tienes una ausencia registrada en ese rango de fechas"},
        )
    absence = Absence(
        user_id=user_id,
        tipo=data.tipo,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        comentario_trabajador=data.comentario_trabajador,
        estado=AusenciaEstadoEnum.pendiente,
    )
    db.add(absence)
    db.commit()
    db.refresh(absence)
    return absence


def review_absence(
    db: Session,
    absence_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    data: AbsenceReview,
) -> Absence:
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
    if data.estado == AusenciaEstadoEnum.denegada and not data.comentario_rrhh:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": True, "code": "COMMENT_REQUIRED", "message": "El comentario es obligatorio al denegar una ausencia"},
        )
    absence.estado = data.estado
    absence.comentario_rrhh = data.comentario_rrhh
    absence.revisado_por = reviewer_id
    absence.fecha_revision = datetime.now(timezone.utc)
    db.commit()
    db.refresh(absence)
    return absence


def get_user_absences(
    db: Session,
    user_id: uuid.UUID,
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
):
    q = db.query(Absence).filter(Absence.user_id == user_id)
    if fecha_inicio:
        q = q.filter(Absence.fecha_fin >= fecha_inicio)
    if fecha_fin:
        q = q.filter(Absence.fecha_inicio <= fecha_fin)
    return q.order_by(Absence.fecha_inicio.desc()).all()


def get_all_absences(
    db: Session,
    user_id: uuid.UUID | None = None,
    estado: AusenciaEstadoEnum | None = None,
):
    q = db.query(Absence)
    if user_id:
        q = q.filter(Absence.user_id == user_id)
    if estado:
        q = q.filter(Absence.estado == estado)
    return q.order_by(Absence.created_at.desc()).all()