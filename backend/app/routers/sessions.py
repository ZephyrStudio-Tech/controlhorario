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
from app.services.log_service import log_activity 

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/clock-in", response_model=WorkSessionOut, status_code=status.HTTP_201_CREATED)
def clock_in(
    payload: WorkSessionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.estado.in_([SessionEstadoEnum.abierta, SessionEstadoEnum.en_pausa]),
    ).first()
    if active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": True, "code": "SESSION_ALREADY_OPEN", "message": "Ya tienes una jornada abierta. Ficha la salida primero."},
        )
    
    ip = get_client_ip(request)
    session = WorkSession(
        user_id=current_user.id,
        fecha_entrada=datetime.now(timezone.utc),
        estado=SessionEstadoEnum.abierta,
        ip_entrada=ip,
        lat_entrada=payload.lat,
        lon_entrada=payload.lon,
        geolocalizacion_denegada_entrada=payload.geolocalizacion_denegada,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    log_activity(db, "CLOCK_IN", f"Inicio de jornada laboral", current_user.id, ip)
    
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
        
    ip = get_client_ip(request)
    
    # Cerrar pausas si las hubiera
    open_pause = db.query(SessionPause).filter(
        SessionPause.session_id == session.id,
        SessionPause.fin_pausa == None,
    ).first()
    
    if open_pause:
        open_pause.fin_pausa = datetime.now(timezone.utc)
        open_pause.ip_fin = ip

    now = datetime.now(timezone.utc)
    session.fecha_salida = now
    session.ip_salida = ip
    session.lat_salida = payload.lat
    session.lon_salida = payload.lon
    session.geolocalizacion_denegada_salida = payload.geolocalizacion_denegada
    session.estado = SessionEstadoEnum.cerrada

    horas_netas, horas_extra = compute_session_hours(session, db, float(current_user.jornada_horas_diarias))
    session.horas_netas = horas_netas
    session.horas_extra = horas_extra

    db.commit()
    db.refresh(session)
    
    log_activity(db, "CLOCK_OUT", f"Fin de jornada ({horas_netas}h netas)", current_user.id, ip)
    
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
    ip = get_client_ip(request)
    pause = SessionPause(
        session_id=session.id,
        tipo=payload.tipo,
        inicio_pausa=datetime.now(timezone.utc),
        ip_inicio=ip,
        lat_inicio=payload.lat,
        lon_inicio=payload.lon,
    )
    session.estado = SessionEstadoEnum.en_pausa
    db.add(pause)
    db.commit()
    db.refresh(pause)
    
    log_activity(db, "PAUSE_START", f"Inicia pausa: {payload.tipo.name}", current_user.id, ip)
    
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
    ip = get_client_ip(request)
    pause.fin_pausa = datetime.now(timezone.utc)
    pause.ip_fin = ip
    pause.lat_fin = payload.lat
    pause.lon_fin = payload.lon
    session.estado = SessionEstadoEnum.abierta
    db.commit()
    db.refresh(pause)
    
    log_activity(db, "PAUSE_END", f"Finaliza pausa: {pause.tipo.name}", current_user.id, ip)
    
    return pause


@router.get("/current", response_model=Optional[WorkSessionOut])
def get_current_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.estado.in_([SessionEstadoEnum.abierta, SessionEstadoEnum.en_pausa]),
    ).first()


@router.get("/all", response_model=List[WorkSessionOut])
def get_all_sessions(
    request: Request, # Añadido para auditoría
    user_id: Optional[uuid.UUID] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    # --- REGISTRO DE AUDITORÍA ---
    log_activity(db, "SESSION_VIEW_ALL", "Consultó el listado histórico de jornadas", current_user.id, get_client_ip(request))

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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    session = db.query(WorkSession).filter(WorkSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "SESSION_NOT_FOUND", "message": "Sesión no encontrada"},
        )
    
    ip = get_client_ip(request)
    update_data = payload.model_dump(exclude_unset=True)
    recalculate = "fecha_entrada" in update_data or "fecha_salida" in update_data

    for key, value in update_data.items():
        setattr(session, key, value)
    
    session.modificado_por = current_user.id
    session.fecha_modificacion = datetime.now(timezone.utc)

    if recalculate and session.fecha_salida and session.fecha_entrada:
        worker = db.query(User).filter(User.id == session.user_id).first()
        jornada = float(worker.jornada_horas_diarias) if worker else 8.0
        horas_netas, horas_extra = compute_session_hours(session, db, jornada)
        session.horas_netas = horas_netas
        session.horas_extra = horas_extra

    db.commit()
    db.refresh(session)
    
    worker_afectado = db.query(User).filter(User.id == session.user_id).first()
    afectado_name = f"{worker_afectado.nombre} {worker_afectado.apellidos}" if worker_afectado else "Usuario"
    
    log_activity(db, "ADMIN_EDIT_SESSION", f"Modificó manualmente la jornada de {afectado_name}", current_user.id, ip)
    
    return session


@router.get("/today/summary")
def today_summary(
    request: Request, # Añadido para auditoría
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    import pytz
    madrid_tz = pytz.timezone("Europe/Madrid")
    now_madrid = datetime.now(madrid_tz)
    today_start = now_madrid.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    today_end = now_madrid.replace(hour=23, minute=59, second=59, microsecond=999999).astimezone(timezone.utc)

    # Registro de auditoría
    log_activity(db, "DASHBOARD_VIEW", "Consultó el resumen de actividad en tiempo real", current_user.id, get_client_ip(request))

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

    return {
        "total_workers": total,
        "fichados": len(abierta_ids),
        "en_pausa": len(en_pausa_ids),
        "salida": len(cerrada_ids),
        "sin_fichar": max(0, total - len(session_user_ids)),
        "activos_hoy": len(abierta_ids),
        "han_salido": len(cerrada_ids),
    }


@router.get("/report")
def export_report(
    request: Request,
    start_date: date = Query(...),
    end_date: date = Query(...),
    user_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
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
    user_ids = list({s.user_id for s in sessions})
    workers_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    import csv as csv_mod
    from io import StringIO

    output = StringIO()
    writer = csv_mod.writer(output, delimiter=";")
    writer.writerow(["Trabajador", "DNI", "Entrada", "Salida", "Estado", "Horas netas", "Horas extra", "IP"])
    
    for s in sessions:
        worker = workers_map.get(s.user_id)
        entrada = s.fecha_entrada.astimezone(madrid_tz) if s.fecha_entrada else None
        salida = s.fecha_salida.astimezone(madrid_tz) if s.fecha_salida else None
        writer.writerow([
            f"{worker.nombre} {worker.apellidos}" if worker else "Desconocido",
            worker.dni if worker else "",
            entrada.strftime("%d/%m/%Y %H:%M") if entrada else "",
            salida.strftime("%d/%m/%Y %H:%M") if salida else "",
            s.estado.value,
            str(s.horas_netas or ""),
            str(s.horas_extra or ""),
            s.ip_entrada or ""
        ])

    output.seek(0)
    
    ip = get_client_ip(request)
    log_activity(db, "REPORT_EXPORT", f"Exportó informe CSV ({start_date} a {end_date})", current_user.id, ip)
    
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=informe_{start_date}_{end_date}.csv"},
    )