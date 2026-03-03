import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.work_session import SessionEstadoEnum
from app.schemas.session_pause import SessionPauseOut


# --- NUEVO: Sub-esquema para enviar la info del trabajador junto a la sesión ---
class SessionUserOut(BaseModel):
    id: uuid.UUID
    nombre: str
    apellidos: str
    rol: str

    model_config = {"from_attributes": True}


class WorkSessionCreate(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
    geolocalizacion_denegada: bool = False


class WorkSessionClose(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
    geolocalizacion_denegada: bool = False


class WorkSessionAdminUpdate(BaseModel):
    fecha_entrada: Optional[datetime] = None
    fecha_salida: Optional[datetime] = None
    estado: Optional[SessionEstadoEnum] = None


class WorkSessionOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    
    # --- AÑADIMOS EL USUARIO AQUÍ PARA QUE LLEGUE AL FRONTEND ---
    user: Optional[SessionUserOut] = None 
    
    fecha_entrada: datetime
    fecha_salida: Optional[datetime]
    estado: SessionEstadoEnum
    ip_entrada: Optional[str]
    ip_salida: Optional[str]
    lat_entrada: Optional[float]
    lon_entrada: Optional[float]
    lat_salida: Optional[float]
    lon_salida: Optional[float]
    geolocalizacion_denegada_entrada: bool
    geolocalizacion_denegada_salida: bool
    horas_netas: Optional[float]
    horas_extra: Optional[float]
    modificado_por: Optional[uuid.UUID]
    fecha_modificacion: Optional[datetime]
    created_at: datetime
    pauses: List[SessionPauseOut] = []

    model_config = {"from_attributes": True}


class WorkSessionSummary(BaseModel):
    total_sessions: int
    total_horas_netas: float
    total_horas_extra: float
    sessions: List[WorkSessionOut]