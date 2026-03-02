from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
import uuid

def log_activity(
    db: Session, 
    accion: str, 
    detalles: str = None, 
    user_id: uuid.UUID = None, 
    ip_address: str = None
):
    """
    Guarda un registro de auditoría en la base de datos.
    """
    try:
        nuevo_log = ActivityLog(
            user_id=user_id,
            accion=accion,
            detalles=detalles,
            ip_address=ip_address
        )
        db.add(nuevo_log)
        db.commit()
    except Exception as e:
        # Si el log falla, hacemos rollback para no romper la app principal
        db.rollback()
        print(f"Error al guardar log de actividad: {e}")