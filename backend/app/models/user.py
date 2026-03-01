import uuid
import enum
from sqlalchemy import String, Boolean, Numeric, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class RolEnum(str, enum.Enum):
    admin = "admin"
    rrhh = "rrhh"
    worker = "worker"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    dni: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    pin_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rol: Mapped[RolEnum] = mapped_column(nullable=False)
    jornada_horas_diarias: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False, default=8.0)
    activo: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=text("now()")
    )

    sessions = relationship("WorkSession", back_populates="user", foreign_keys="WorkSession.user_id")
    absences = relationship("Absence", back_populates="user", foreign_keys="Absence.user_id")
    documents = relationship("Document", back_populates="user")
