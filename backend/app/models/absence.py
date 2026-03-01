import uuid
import enum
from sqlalchemy import Text, Date, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class AusenciaTipoEnum(str, enum.Enum):
    VACACIONES_ANUALES = "VACACIONES_ANUALES"
    BAJA_MEDICA = "BAJA_MEDICA"
    ACCIDENTE_LABORAL = "ACCIDENTE_LABORAL"
    MATERNIDAD = "MATERNIDAD"
    PATERNIDAD_NACIMIENTO = "PATERNIDAD_NACIMIENTO"
    PERMISO_MATRIMONIO = "PERMISO_MATRIMONIO"
    PERMISO_FALLECIMIENTO_FAMILIAR = "PERMISO_FALLECIMIENTO_FAMILIAR"
    PERMISO_MUDANZA = "PERMISO_MUDANZA"
    ASUNTOS_PROPIOS = "ASUNTOS_PROPIOS"
    PERMISO_NO_RETRIBUIDO = "PERMISO_NO_RETRIBUIDO"
    OTROS = "OTROS"


class AusenciaEstadoEnum(str, enum.Enum):
    pendiente = "pendiente"
    aprobada = "aprobada"
    denegada = "denegada"


class Absence(Base):
    __tablename__ = "absences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tipo: Mapped[AusenciaTipoEnum] = mapped_column(nullable=False)
    fecha_inicio: Mapped[str] = mapped_column(Date(), nullable=False)
    fecha_fin: Mapped[str] = mapped_column(Date(), nullable=False)
    estado: Mapped[AusenciaEstadoEnum] = mapped_column(nullable=False, default=AusenciaEstadoEnum.pendiente)
    comentario_trabajador: Mapped[str | None] = mapped_column(Text(), nullable=True)
    comentario_rrhh: Mapped[str | None] = mapped_column(Text(), nullable=True)
    revisado_por: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    fecha_revision: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=text("now()")
    )

    user = relationship("User", back_populates="absences", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[revisado_por])
