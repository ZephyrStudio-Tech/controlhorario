"""initial schema

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("apellidos", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=True, unique=True),
        sa.Column("dni", sa.String(20), nullable=False, unique=True),
        sa.Column("pin_hash", sa.String(255), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column(
            "rol",
            sa.Enum("admin", "rrhh", "worker", name="rol_enum"),
            nullable=False,
        ),
        sa.Column("jornada_horas_diarias", sa.Numeric(4, 2), nullable=False, server_default="8.0"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # work_sessions
    op.create_table(
        "work_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("fecha_entrada", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("fecha_salida", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "estado",
            sa.Enum("abierta", "en_pausa", "cerrada", "incompleta", name="session_estado_enum"),
            nullable=False,
            server_default="abierta",
        ),
        sa.Column("ip_entrada", sa.String(45), nullable=True),
        sa.Column("ip_salida", sa.String(45), nullable=True),
        sa.Column("lat_entrada", sa.Numeric(10, 7), nullable=True),
        sa.Column("lon_entrada", sa.Numeric(10, 7), nullable=True),
        sa.Column("lat_salida", sa.Numeric(10, 7), nullable=True),
        sa.Column("lon_salida", sa.Numeric(10, 7), nullable=True),
        sa.Column("geolocalizacion_denegada_entrada", sa.Boolean(), server_default="false"),
        sa.Column("geolocalizacion_denegada_salida", sa.Boolean(), server_default="false"),
        sa.Column("horas_netas", sa.Numeric(6, 2), nullable=True),
        sa.Column("horas_extra", sa.Numeric(6, 2), nullable=True),
        sa.Column("modificado_por", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("fecha_modificacion", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_work_sessions_user_id", "work_sessions", ["user_id"])
    op.create_index("ix_work_sessions_fecha_entrada", "work_sessions", ["fecha_entrada"])

    # session_pauses
    op.create_table(
        "session_pauses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_sessions.id"), nullable=False),
        sa.Column(
            "tipo",
            sa.Enum("descanso", "comida", "otro", name="pausa_tipo_enum"),
            nullable=False,
            server_default="descanso",
        ),
        sa.Column("inicio_pausa", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("fin_pausa", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("ip_inicio", sa.String(45), nullable=True),
        sa.Column("ip_fin", sa.String(45), nullable=True),
        sa.Column("lat_inicio", sa.Numeric(10, 7), nullable=True),
        sa.Column("lon_inicio", sa.Numeric(10, 7), nullable=True),
        sa.Column("lat_fin", sa.Numeric(10, 7), nullable=True),
        sa.Column("lon_fin", sa.Numeric(10, 7), nullable=True),
    )
    op.create_index("ix_session_pauses_session_id", "session_pauses", ["session_id"])

    # absences
    op.create_table(
        "absences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "tipo",
            sa.Enum(
                "VACACIONES_ANUALES",
                "BAJA_MEDICA",
                "ACCIDENTE_LABORAL",
                "MATERNIDAD",
                "PATERNIDAD_NACIMIENTO",
                "PERMISO_MATRIMONIO",
                "PERMISO_FALLECIMIENTO_FAMILIAR",
                "PERMISO_MUDANZA",
                "ASUNTOS_PROPIOS",
                "PERMISO_NO_RETRIBUIDO",
                "OTROS",
                name="ausencia_tipo_enum",
            ),
            nullable=False,
        ),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=False),
        sa.Column(
            "estado",
            sa.Enum("pendiente", "aprobada", "denegada", name="ausencia_estado_enum"),
            nullable=False,
            server_default="pendiente",
        ),
        sa.Column("comentario_trabajador", sa.Text(), nullable=True),
        sa.Column("comentario_rrhh", sa.Text(), nullable=True),
        sa.Column("revisado_por", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("fecha_revision", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_absences_user_id", "absences", ["user_id"])

    # documents
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("nombre_original", sa.String(255), nullable=False),
        sa.Column("ruta_fichero", sa.String(500), nullable=False),
        sa.Column("tipo_mime", sa.String(100), nullable=False),
        sa.Column("tamaño_bytes", sa.Integer(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "subido_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_documents_user_id", "documents", ["user_id"])


def downgrade() -> None:
    op.drop_table("documents")
    op.drop_table("absences")
    op.drop_table("session_pauses")
    op.drop_table("work_sessions")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS rol_enum")
    op.execute("DROP TYPE IF EXISTS session_estado_enum")
    op.execute("DROP TYPE IF EXISTS pausa_tipo_enum")
    op.execute("DROP TYPE IF EXISTS ausencia_tipo_enum")
    op.execute("DROP TYPE IF EXISTS ausencia_estado_enum")
