from app.services.log_service import log_activity # Asegúrate de tener el import

@router.get("/", response_model=List[ActivityLogOut])
def get_activity_logs(
    limit: int = Query(300),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # FORZAMOS UN LOG AQUÍ MISMO
    log_activity(db, "AUDIT_VIEW", "El administrador visualiza los logs", current_user.id)
    
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()