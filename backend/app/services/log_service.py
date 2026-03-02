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
    Guarda un registro de auditoría en la base de datos con trazas de depuración.
    """
    print(f"DEBUG: Intentando registrar acción: {accion} para el usuario: {user_id}")
    
    try:
        nuevo_log = ActivityLog(
            user_id=user_id,
            accion=accion,
            detalles=detalles,
            ip_address=ip_address
        )
        db.add(nuevo_log)
        db.commit()
        db.refresh(nuevo_log) # Sincroniza el objeto con la DB
        
        print(f"DEBUG: ¡Acción '{accion}' guardada con éxito en activity_logs!")
        
    except Exception as e:
        # Si el log falla, hacemos rollback para no bloquear la base de datos
        db.rollback()
        print(f"DEBUG ERROR: Fallo crítico al guardar log de actividad: {str(e)}")