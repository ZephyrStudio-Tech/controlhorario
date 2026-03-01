import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO, StringIO
import csv
from app.database import get_db
from app.models.user import User, RolEnum
from app.models.work_session import WorkSession, SessionEstadoEnum
from app.models.absence import Absence
from app.services.auth_service import require_admin_or_rrhh, require_admin

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/attendance/csv")
def export_attendance_csv(
    user_id: Optional[uuid.UUID] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    from datetime import timezone
    q = db.query(WorkSession)
    if user_id:
        q = q.filter(WorkSession.user_id == user_id)
    if start_date:
        from datetime import datetime as dt
        q = q.filter(WorkSession.fecha_entrada >= dt.combine(start_date, dt.min.time()).replace(tzinfo=timezone.utc))
    if end_date:
        from datetime import datetime as dt
        q = q.filter(WorkSession.fecha_entrada <= dt.combine(end_date, dt.max.time()).replace(tzinfo=timezone.utc))
    sessions = q.order_by(WorkSession.fecha_entrada.asc()).all()

    output = StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "ID", "Trabajador", "Fecha", "Entrada", "Salida", "Estado",
        "Horas Netas", "Horas Extra", "IP Entrada", "Lat Entrada", "Lon Entrada"
    ])
    for s in sessions:
        worker = db.query(User).filter(User.id == s.user_id).first()
        nombre = f"{worker.nombre} {worker.apellidos}" if worker else str(s.user_id)
        fecha = s.fecha_entrada.strftime("%d/%m/%Y") if s.fecha_entrada else ""
        entrada = s.fecha_entrada.strftime("%H:%M:%S") if s.fecha_entrada else ""
        salida = s.fecha_salida.strftime("%H:%M:%S") if s.fecha_salida else ""
        writer.writerow([
            str(s.id), nombre, fecha, entrada, salida, s.estado,
            s.horas_netas or 0, s.horas_extra or 0,
            s.ip_entrada or "", s.lat_entrada or "", s.lon_entrada or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=asistencia.csv"}
    )


@router.get("/absences/csv")
def export_absences_csv(
    user_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    q = db.query(Absence)
    if user_id:
        q = q.filter(Absence.user_id == user_id)
    absences = q.order_by(Absence.fecha_inicio.asc()).all()

    output = StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["ID", "Trabajador", "Tipo", "Inicio", "Fin", "Estado", "Comentario Trabajador", "Comentario RRHH"])
    for a in absences:
        worker = db.query(User).filter(User.id == a.user_id).first()
        nombre = f"{worker.nombre} {worker.apellidos}" if worker else str(a.user_id)
        writer.writerow([
            str(a.id), nombre, a.tipo, a.fecha_inicio, a.fecha_fin,
            a.estado, a.comentario_trabajador or "", a.comentario_rrhh or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ausencias.csv"}
    )
