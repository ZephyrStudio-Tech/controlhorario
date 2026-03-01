import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.session_pause import PausaTipoEnum


class SessionPauseCreate(BaseModel):
    tipo: PausaTipoEnum = PausaTipoEnum.descanso
    lat: Optional[float] = None
    lon: Optional[float] = None
    geolocalizacion_denegada: bool = False


class SessionPauseEnd(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
    geolocalizacion_denegada: bool = False


class SessionPauseOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    tipo: PausaTipoEnum
    inicio_pausa: datetime
    fin_pausa: Optional[datetime]
    ip_inicio: Optional[str]
    ip_fin: Optional[str]
    lat_inicio: Optional[float]
    lon_inicio: Optional[float]
    lat_fin: Optional[float]
    lon_fin: Optional[float]

    model_config = {"from_attributes": True}
