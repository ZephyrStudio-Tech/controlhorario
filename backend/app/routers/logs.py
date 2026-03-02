# Añade 'Request' a los imports de fastapi
from fastapi import APIRouter, Depends, Query, Request 
# Añade este import para la IP
from app.services.session_service import get_client_ip 

@router.get("/", response_model=List[ActivityLogOut])
def get_activity_logs(
    request: Request, # <--- Añadimos el request aquí
    limit: int = Query(300),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Ahora pasamos la IP también al log
    log_activity(
        db, 
        "AUDIT_VIEW", 
        "El administrador visualiza los logs", 
        current_user.id, 
        get_client_ip(request) # <--- IP registrada
    )
    
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()