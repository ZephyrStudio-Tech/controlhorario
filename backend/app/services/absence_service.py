from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.absence import Absence, AbsenceEstado
from app.models.work_session import WorkSession, SessionEstado
from app.schemas.absence import AbsenceCreate, AbsenceReview
from app.utils.permissions import can_review_absences
import uuid
from datetime import date, datetime, timezone


def create_absence(db: Session, user_id: str, data: AbsenceCreate) -> Absence:
    # Check for overlapping absences for the same user
    overlap = (
        db.query(Absence)
        .filter(
            Absence.user_id == user_id,
            Absence.fecha_fin >= data.fecha_inicio,
            Absence.fecha_inicio <= data.fecha_fin,
            Absence.estado != AbsenceEstado.denegada,
        )
        .first()
    )
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": True,
                "code": "ABSENCE_OVERLAP",
                "message": "Ya tienes una ausencia registrada en ese rango de fechas.",
            },
        )

    absence = Absence(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tipo=data.tipo,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        comentario_trabajador=data.comentario_trabajador,
        estado=AbsenceEstado.pendiente,
    )
    db.add(absence)
    db.commit()
    db.refresh(absence)
    return absence


def review_absence(
    db: Session,
    absence_id: str,
    reviewer_id: str,
    reviewer,
    data: AbsenceReview,
) -> Absence:
    if not can_review_absences(reviewer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": True,
                "code": "FORBIDDEN",
                "message": "No tienes permisos para revisar ausencias.",
            },
        )

    absence = db.query(Absence).filter(Absence.id == absence_id).first()
    if not absence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "ABSENCE_NOT_FOUND", "message": "Ausencia no encontrada."},
        )

    if absence.estado != AbsenceEstado.pendiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "code": "ABSENCE_ALREADY_REVIEWED",
                "message": "Esta ausencia ya ha sido revisada.",
            },
        )

    if data.estado == AbsenceEstado.denegada and not data.comentario_rrhh:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": True,
                "code": "COMMENT_REQUIRED",
                "message": "El comentario es obligatorio al denegar una ausencia.",
            },
        )

    absence.estado = data.estado
    absence.comentario_rrhh = data.comentario_rrhh
    absence.revisado_por = reviewer_id
    absence.fecha_revision = datetime.now(timezone.utc)
    db.commit()
    db.refresh(absence)
    return absence


def get_user_absences(db: Session, user_id: str):
    return (
        db.query(Absence)
        .filter(Absence.user_id == user_id)
        .order_by(Absence.created_at.desc())
        .all()
    )


def get_all_absences(db: Session, user_id: str | None = None, estado: str | None = None):
    q = db.query(Absence)
    if user_id:
        q = q.filter(Absence.user_id == user_id)
    if estado:
        q = q.filter(Absence.estado == estado)
    return q.order_by(Absence.created_at.desc()).all()
