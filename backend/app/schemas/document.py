import uuid
from datetime import datetime
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    nombre_original: str
    tipo_mime: str
    tamaño_bytes: int
    activo: bool
    subido_en: datetime

    model_config = {"from_attributes": True}
