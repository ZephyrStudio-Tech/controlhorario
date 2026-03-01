import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from app.models.absence import AusenciaTipoEnum, AusenciaEstadoEnum


class AbsenceCreate(BaseModel):
    tipo: AusenciaTipoEnum
    fecha_inicio: date
    fecha_fin: date
    comentario_trabajador: Optional[str] = None


class AbsenceReview(BaseModel):
    estado: AusenciaEstadoEnum
    comentario_rrhh: Optional[str] = None


class AbsenceOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tipo: AusenciaTipoEnum
    fecha_inicio: date
    fecha_fin: date
    estado: AusenciaEstadoEnum
    comentario_trabajador: Optional[str]
    comentario_rrhh: Optional[str]
    revisado_por: Optional[uuid.UUID]
    fecha_revision: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
