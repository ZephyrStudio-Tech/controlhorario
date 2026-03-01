import uuid
from datetime import datetime, date, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import StringIO
import csv
import pytz

from app.database import get_db
from app.models.user import User, RolEnum
from app.models.work_session import WorkSession, SessionEstadoEnum
from app.models.absence import Absence
from app.services.auth_service import require_admin_or_rrhh, require_admin

router = APIRouter(prefix="/reports", tags=["reports"])

MADRID_TZ = pytz.timezone("Europe/Madrid")


@router.get("/attendance/csv")
def export_attendance_csv(
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
    sessions = q.order_by(WorkSession.fecha_entrada.asc()).all()

    # Cargar todos los usuarios de una sola query (evita N+1)
    user_ids = list({s.user_id for s in sessions})
    workers_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    output = StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "ID", "Trabajador", "DNI", "Fecha", "Entrada", "Salida", "Estado",
        "Horas Netas", "Horas Extra", "IP Entrada", "Lat Entrada", "Lon Entrada"
    ])
    for s in sessions:
        worker = workers_map.get(s.user_id)
        nombre = f"{worker.nombre} {worker.apellidos}" if worker else str(s.user_id)
        dni = worker.dni if worker else ""
        # Convertir a hora Madrid para el CSV
        entrada_madrid = s.fecha_entrada.astimezone(MADRID_TZ) if s.fecha_entrada else None
        salida_madrid = s.fecha_salida.astimezone(MADRID_TZ) if s.fecha_salida else None
        fecha = entrada_madrid.strftime("%d/%m/%Y") if entrada_madrid else ""
        entrada = entrada_madrid.strftime("%H:%M:%S") if entrada_madrid else ""
        salida = salida_madrid.strftime("%H:%M:%S") if salida_madrid else ""
        writer.writerow([
            str(s.id), nombre, dni, fecha, entrada, salida,
            s.estado.value if s.estado else "",
            s.horas_netas or 0, s.horas_extra or 0,
            s.ip_entrada or "", s.lat_entrada or "", s.lon_entrada or ""
        ])

    output.seek(0)
    filename = f"asistencia_{start_date or 'todo'}_{end_date or 'todo'}.csv"
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/absences/csv")
def export_absences_csv(
    user_id: Optional[uuid.UUID] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    q = db.query(Absence)
    if user_id:
        q = q.filter(Absence.user_id == user_id)
    if start_date:
        q = q.filter(Absence.fecha_fin >= start_date)
    if end_date:
        q = q.filter(Absence.fecha_inicio <= end_date)
    absences = q.order_by(Absence.fecha_inicio.asc()).all()

    # Cargar todos los usuarios de una sola query (evita N+1)
    user_ids = list({a.user_id for a in absences})
    workers_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    output = StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "ID", "Trabajador", "DNI", "Tipo", "Inicio", "Fin",
        "Estado", "Comentario Trabajador", "Comentario RRHH"
    ])
    for a in absences:
        worker = workers_map.get(a.user_id)
        nombre = f"{worker.nombre} {worker.apellidos}" if worker else str(a.user_id)
        dni = worker.dni if worker else ""
        writer.writerow([
            str(a.id), nombre, dni,
            a.tipo.value if a.tipo else "",
            a.fecha_inicio.strftime("%d/%m/%Y") if a.fecha_inicio else "",
            a.fecha_fin.strftime("%d/%m/%Y") if a.fecha_fin else "",
            a.estado.value if a.estado else "",
            a.comentario_trabajador or "",
            a.comentario_rrhh or ""
        ])

    output.seek(0)
    filename = f"ausencias_{start_date or 'todo'}_{end_date or 'todo'}.csv"
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )