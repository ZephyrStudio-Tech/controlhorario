import uuid
import enum
from sqlalchemy import String, Boolean, Numeric, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class SessionEstadoEnum(str, enum.Enum):
    abierta = "abierta"
    en_pausa = "en_pausa"
    cerrada = "cerrada"
    incompleta = "incompleta"


class WorkSession(Base):
    __tablename__ = "work_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    fecha_entrada: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    fecha_salida: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    estado: Mapped[SessionEstadoEnum] = mapped_column(nullable=False, default=SessionEstadoEnum.abierta)
    ip_entrada: Mapped[str | None] = mapped_column(String(45), nullable=True)
    ip_salida: Mapped[str | None] = mapped_column(String(45), nullable=True)
    lat_entrada: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lon_entrada: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lat_salida: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lon_salida: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    geolocalizacion_denegada_entrada: Mapped[bool] = mapped_column(Boolean(), default=False)
    geolocalizacion_denegada_salida: Mapped[bool] = mapped_column(Boolean(), default=False)
    horas_netas: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    horas_extra: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    modificado_por: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    fecha_modificacion: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=text("now()")
    )

    user = relationship("User", back_populates="sessions", foreign_keys=[user_id])
    editor = relationship("User", foreign_keys=[modificado_por])
    pauses = relationship("SessionPause", back_populates="session", cascade="all, delete-orphan")
