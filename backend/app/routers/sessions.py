import uuid
from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RolEnum
from app.models.work_session import WorkSession, SessionEstadoEnum
from app.models.session_pause import SessionPause
from app.schemas.work_session import WorkSessionCreate, WorkSessionClose, WorkSessionOut, WorkSessionAdminUpdate
from app.schemas.session_pause import SessionPauseCreate, SessionPauseEnd, SessionPauseOut
from app.services.auth_service import get_current_user, require_admin, require_admin_or_rrhh
from app.services.session_service import (
    get_client_ip,
    compute_session_hours,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/clock-in", response_model=WorkSessionOut, status_code=status.HTTP_201_CREATED)
def clock_in(
    payload: WorkSessionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # mark_incomplete_sessions eliminado de aquí — ahora lo gestiona el scheduler en main.py
    active = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.estado.in_([SessionEstadoEnum.abierta, SessionEstadoEnum.en_pausa]),
    ).first()
    if active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": True, "code": "SESSION_ALREADY_OPEN", "message": "Ya tienes una jornada abierta. Ficha la salida primero."},
        )
    session = WorkSession(
        user_id=current_user.id,
        fecha_entrada=datetime.now(timezone.utc),
        estado=SessionEstadoEnum.abierta,
        ip_entrada=get_client_ip(request),
        lat_entrada=payload.lat,
        lon_entrada=payload.lon,
        geolocalizacion_denegada_entrada=payload.geolocalizacion_denegada,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/clock-out", response_model=WorkSessionOut)
def clock_out(
    payload: WorkSessionClose,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.estado.in_([SessionEstadoEnum.abierta, SessionEstadoEnum.en_pausa]),
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "NO_OPEN_SESSION", "message": "No tienes ninguna jornada abierta"},
        )
    # Close any open pause first
    open_pause = db.query(SessionPause).filter(
        SessionPause.session_id == session.id,
        SessionPause.fin_pausa == None,
    ).first()
    if open_pause:
        open_pause.fin_pausa = datetime.now(timezone.utc)
        open_pause.ip_fin = get_client_ip(request)

    now = datetime.now(timezone.utc)
    session.fecha_salida = now
    session.ip_salida = get_client_ip(request)
    session.lat_salida = payload.lat
    session.lon_salida = payload.lon
    session.geolocalizacion_denegada_salida = payload.geolocalizacion_denegada
    session.estado = SessionEstadoEnum.cerrada

    horas_netas, horas_extra = compute_session_hours(session, db, float(current_user.jornada_horas_diarias))
    session.horas_netas = horas_netas
    session.horas_extra = horas_extra

    db.commit()
    db.refresh(session)
    return session


@router.post("/pause/start", response_model=SessionPauseOut, status_code=status.HTTP_201_CREATED)
def start_pause(
    payload: SessionPauseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.estado == SessionEstadoEnum.abierta,
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "NO_OPEN_SESSION", "message": "No tienes ninguna jornada abierta"},
        )
    pause = SessionPause(
        session_id=session.id,
        tipo=payload.tipo,
        inicio_pausa=datetime.now(timezone.utc),
        ip_inicio=get_client_ip(request),
        lat_inicio=payload.lat,
        lon_inicio=payload.lon,
    )
    session.estado = SessionEstadoEnum.en_pausa
    db.add(pause)
    db.commit()
    db.refresh(pause)
    return pause


@router.post("/pause/end", response_model=SessionPauseOut)
def end_pause(
    payload: SessionPauseEnd,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.estado == SessionEstadoEnum.en_pausa,
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "NOT_IN_PAUSE", "message": "No estás en pausa"},
        )
    pause = db.query(SessionPause).filter(
        SessionPause.session_id == session.id,
        SessionPause.fin_pausa == None,
    ).first()
    if not pause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "NO_OPEN_PAUSE", "message": "No hay pausa abierta"},
        )
    pause.fin_pausa = datetime.now(timezone.utc)
    pause.ip_fin = get_client_ip(request)
    pause.lat_fin = payload.lat
    pause.lon_fin = payload.lon
    session.estado = SessionEstadoEnum.abierta
    db.commit()
    db.refresh(pause)
    return pause


@router.get("/current", response_model=Optional[WorkSessionOut])
def get_current_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.estado.in_([SessionEstadoEnum.abierta, SessionEstadoEnum.en_pausa]),
    ).first()
    return session


@router.get("/my", response_model=List[WorkSessionOut])
def get_my_sessions(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(WorkSession).filter(WorkSession.user_id == current_user.id)
    if start_date:
        q = q.filter(WorkSession.fecha_entrada >= datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc))
    if end_date:
        q = q.filter(WorkSession.fecha_entrada <= datetime.combine(end_date, datetime.max.time()).replace(tzinfo=timezone.utc))
    return q.order_by(WorkSession.fecha_entrada.desc()).all()


@router.get("/all", response_model=List[WorkSessionOut])
def get_all_sessions(
    user_id: Optional[uuid.UUID] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    q = db.query(WorkSession)
    if user_id:
        q = q.filter(WorkSession.user_id == user_id)
    if start_date:
        q = q.filter(WorkSession.fecha_entrada >= datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc))
    if end_date:
        q = q.filter(WorkSession.fecha_entrada <= datetime.combine(end_date, datetime.max.time()).replace(tzinfo=timezone.utc))
    return q.order_by(WorkSession.fecha_entrada.desc()).all()


@router.patch("/{session_id}", response_model=WorkSessionOut)
def admin_update_session(
    session_id: uuid.UUID,
    payload: WorkSessionAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    session = db.query(WorkSession).filter(WorkSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "SESSION_NOT_FOUND", "message": "Sesión no encontrada"},
        )
    update_data = payload.model_dump(exclude_unset=True)

    # Detectar si se están modificando fechas para decidir si recalcular
    recalculate = "fecha_entrada" in update_data or "fecha_salida" in update_data

    for key, value in update_data.items():
        setattr(session, key, value)
    session.modificado_por = current_user.id
    session.fecha_modificacion = datetime.now(timezone.utc)

    # Recalcular solo si cambiaron fechas y la sesión tiene entrada y salida
    if recalculate and session.fecha_salida and session.fecha_entrada:
        worker = db.query(User).filter(User.id == session.user_id).first()
        jornada = float(worker.jornada_horas_diarias) if worker else 8.0
        horas_netas, horas_extra = compute_session_hours(session, db, jornada)
        session.horas_netas = horas_netas
        session.horas_extra = horas_extra

    db.commit()
    db.refresh(session)
    return session


@router.get("/today/summary")
def today_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    """Dashboard summary: how many workers clocked in, paused, out, absent today."""
    import pytz
    madrid_tz = pytz.timezone("Europe/Madrid")
    now_madrid = datetime.now(madrid_tz)
    today_start = now_madrid.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    today_end = now_madrid.replace(hour=23, minute=59, second=59, microsecond=999999).astimezone(timezone.utc)

    workers = db.query(User).filter(User.rol == RolEnum.worker, User.activo == True).all()
    total = len(workers)

    today_sessions = (
        db.query(WorkSession)
        .filter(WorkSession.fecha_entrada >= today_start, WorkSession.fecha_entrada <= today_end)
        .all()
    )
    session_user_ids = {str(s.user_id) for s in today_sessions}

    abierta_ids = {str(s.user_id) for s in today_sessions if s.estado == SessionEstadoEnum.abierta}
    en_pausa_ids = {str(s.user_id) for s in today_sessions if s.estado == SessionEstadoEnum.en_pausa}
    cerrada_ids = {str(s.user_id) for s in today_sessions if s.estado == SessionEstadoEnum.cerrada}
    sin_fichar = total - len(session_user_ids)

    return {
        "total_workers": total,
        "fichados": len(abierta_ids),
        "en_pausa": len(en_pausa_ids),
        "salida": len(cerrada_ids),
        "sin_fichar": max(0, sin_fichar),
        "activos_hoy": len(abierta_ids),
        "han_salido": len(cerrada_ids),
    }


@router.get("/report")
def export_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    user_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    """Export attendance report as CSV."""
    import pytz
    madrid_tz = pytz.timezone("Europe/Madrid")

    start_dt = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, datetime.max.time()).replace(tzinfo=timezone.utc)

    q = db.query(WorkSession).filter(
        WorkSession.fecha_entrada >= start_dt,
        WorkSession.fecha_entrada <= end_dt,
    )
    if user_id:
        q = q.filter(WorkSession.user_id == user_id)
    sessions = q.order_by(WorkSession.fecha_entrada).all()

    # Cargar todos los usuarios necesarios de una sola query (evita N+1)
    user_ids = list({s.user_id for s in sessions})
    workers_map = {
        u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }

    import csv as csv_mod
    from io import StringIO

    output = StringIO()
    writer = csv_mod.writer(output, delimiter=";")
    writer.writerow([
        "Trabajador", "DNI", "Fecha entrada", "Fecha salida",
        "Estado", "Horas netas", "Horas extra", "IP entrada",
    ])
    for s in sessions:
        worker = workers_map.get(s.user_id)
        # Convertir timestamps a Europe/Madrid para el CSV
        entrada_madrid = s.fecha_entrada.astimezone(madrid_tz) if s.fecha_entrada else None
        salida_madrid = s.fecha_salida.astimezone(madrid_tz) if s.fecha_salida else None
        writer.writerow([
            f"{worker.nombre} {worker.apellidos}" if worker else str(s.user_id),
            worker.dni if worker else "",
            entrada_madrid.strftime("%d/%m/%Y %H:%M") if entrada_madrid else "",
            salida_madrid.strftime("%d/%m/%Y %H:%M") if salida_madrid else "",
            s.estado.value if s.estado else "",
            str(s.horas_netas) if s.horas_netas is not None else "",
            str(s.horas_extra) if s.horas_extra is not None else "",
            s.ip_entrada or "",
        ])

    output.seek(0)
    filename = f"informe_{start_date}_{end_date}.csv"
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )