import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class LogUserOut(BaseModel):
    nombre: str
    apellidos: str
    rol: str

    model_config = {"from_attributes": True}

class ActivityLogOut(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    user: Optional[LogUserOut] = None
    accion: str
    detalles: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}