import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.absence import AbsenceEstadoEnum, AbsenceTipoEnum

# --- NUEVO: Sub-esquema para enviar la info del trabajador junto a la ausencia ---
class AbsenceUserOut(BaseModel):
    id: uuid.UUID
    nombre: str
    apellidos: str
    rol: str

    model_config = {"from_attributes": True}

class AbsenceCreate(BaseModel):
    tipo: AbsenceTipoEnum
    fecha_inicio: date
    fecha_fin: date
    comentario_trabajador: Optional[str] = None

class AbsenceReview(BaseModel):
    estado: AbsenceEstadoEnum
    comentario_rrhh: Optional[str] = None

class AbsenceOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    
    # --- AÑADIMOS EL USUARIO AQUÍ PARA QUE LLEGUE AL FRONTEND ---
    user: Optional[AbsenceUserOut] = None 
    
    tipo: AbsenceTipoEnum
    fecha_inicio: date
    fecha_fin: date
    estado: AbsenceEstadoEnum
    comentario_trabajador: Optional[str]
    comentario_rrhh: Optional[str]
    revisado_por: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}