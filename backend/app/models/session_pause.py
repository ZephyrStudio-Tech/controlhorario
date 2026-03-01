import uuid
import enum
from sqlalchemy import String, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class PausaTipoEnum(str, enum.Enum):
    descanso = "descanso"
    comida = "comida"
    otro = "otro"


class SessionPause(Base):
    __tablename__ = "session_pauses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("work_sessions.id"), nullable=False)
    tipo: Mapped[PausaTipoEnum] = mapped_column(nullable=False, default=PausaTipoEnum.descanso)
    inicio_pausa: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    fin_pausa: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    ip_inicio: Mapped[str | None] = mapped_column(String(45), nullable=True)
    ip_fin: Mapped[str | None] = mapped_column(String(45), nullable=True)
    lat_inicio: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lon_inicio: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lat_fin: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lon_fin: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)

    session = relationship("WorkSession", back_populates="pauses")
