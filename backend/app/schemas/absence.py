import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
# IMPORTACIÓN CORREGIDA: Usando los nombres en español que tienes en tu modelo
from app.models.absence import AusenciaEstadoEnum, AusenciaTipoEnum


class AbsenceUserOut(BaseModel):
    id: uuid.UUID
    nombre: str
    apellidos: str
    rol: str

    model_config = {"from_attributes": True}


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
    user: Optional[AbsenceUserOut] = None 
    tipo: AusenciaTipoEnum
    fecha_inicio: date
    fecha_fin: date
    estado: AusenciaEstadoEnum
    comentario_trabajador: Optional[str]
    comentario_rrhh: Optional[str]
    revisado_por: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}