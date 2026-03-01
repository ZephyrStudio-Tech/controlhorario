from datetime import datetime, timezone, timedelta
from typing import Tuple
from fastapi import Request
from sqlalchemy.orm import Session
from app.models.work_session import WorkSession, SessionEstadoEnum
from app.models.session_pause import SessionPause


def get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For for reverse proxy setups."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"


def compute_session_hours(
    session: WorkSession,
    db: Session,
    jornada_horas: float,
) -> Tuple[float, float]:
    """Calculate net worked hours and overtime for a closed session."""
    if not session.fecha_entrada or not session.fecha_salida:
        return 0.0, 0.0

    entrada = session.fecha_entrada
    salida = session.fecha_salida

    if not entrada.tzinfo:
        entrada = entrada.replace(tzinfo=timezone.utc)
    if not salida.tzinfo:
        salida = salida.replace(tzinfo=timezone.utc)

    bruto_seconds = (salida - entrada).total_seconds()

    # Sum all closed pauses
    pauses = db.query(SessionPause).filter(
        SessionPause.session_id == session.id,
        SessionPause.fin_pausa != None,
    ).all()

    pausa_seconds = 0.0
    for p in pauses:
        inicio = p.inicio_pausa
        fin = p.fin_pausa
        if not inicio.tzinfo:
            inicio = inicio.replace(tzinfo=timezone.utc)
        if not fin.tzinfo:
            fin = fin.replace(tzinfo=timezone.utc)
        pausa_seconds += (fin - inicio).total_seconds()

    neto_seconds = max(0.0, bruto_seconds - pausa_seconds)
    neto_horas = round(neto_seconds / 3600, 2)
    extra_horas = round(max(0.0, neto_horas - jornada_horas), 2)

    return neto_horas, extra_horas


def mark_incomplete_sessions(db: Session) -> None:
    """Mark sessions older than 24h that are still open/paused as INCOMPLETA."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    stale = db.query(WorkSession).filter(
        WorkSession.estado.in_([SessionEstadoEnum.abierta, SessionEstadoEnum.en_pausa]),
        WorkSession.fecha_entrada <= cutoff,
    ).all()
    for s in stale:
        s.estado = SessionEstadoEnum.incompleta
    if stale:
        db.commit()
