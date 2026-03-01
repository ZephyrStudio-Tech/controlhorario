import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import RolEnum


class UserCreate(BaseModel):
    nombre: str
    apellidos: str
    email: Optional[str] = None
    dni: str
    password: Optional[str] = None
    rol: RolEnum
    jornada_horas_diarias: float = 8.0


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[str] = None
    dni: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[RolEnum] = None
    jornada_horas_diarias: Optional[float] = None
    activo: Optional[bool] = None


class UserOut(BaseModel):
    id: uuid.UUID
    nombre: str
    apellidos: str
    email: Optional[str]
    dni: str
    rol: RolEnum
    jornada_horas_diarias: float
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserOutBasic(BaseModel):
    id: uuid.UUID
    nombre: str
    apellidos: str
    rol: RolEnum

    model_config = {"from_attributes": True}
