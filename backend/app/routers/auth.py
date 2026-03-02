from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginEmail, LoginDNI, TokenResponse, RefreshRequest
from app.schemas.user import UserOut
from app.services.auth_service import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.services.session_service import get_client_ip
from app.services.log_service import log_activity 
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login/email", response_model=TokenResponse)
def login_email(payload: LoginEmail, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    user = db.query(User).filter(User.email == payload.email, User.activo == True).first()
    
    # Verificación de credenciales
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        # --- AUDITORÍA DE FALLO ---
        log_activity(db, "LOGIN_FAILED", f"Intento fallido de login con email: {payload.email}", None, ip)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": True, "code": "INVALID_CREDENTIALS", "message": "Credenciales incorrectas"},
        )
        
    token_data = {"sub": str(user.id), "rol": user.rol}
    
    # --- AUDITORÍA DE ÉXITO ---
    log_activity(db, "LOGIN_EMAIL", "Inicio de sesión vía Email", user.id, ip)
    
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/login/dni", response_model=TokenResponse)
def login_dni(payload: LoginDNI, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    dni_upper = payload.dni.upper()
    user = db.query(User).filter(User.dni == dni_upper, User.activo == True).first()
    
    if not user or not user.pin_hash or not verify_password(dni_upper, user.pin_hash):
        # --- AUDITORÍA DE FALLO ---
        log_activity(db, "LOGIN_FAILED", f"Intento fallido de login con DNI: {dni_upper}", None, ip)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": True, "code": "INVALID_CREDENTIALS", "message": "DNI/PIN incorrecto"},
        )
        
    token_data = {"sub": str(user.id), "rol": user.rol}
    
    # --- AUDITORÍA DE ÉXITO ---
    log_activity(db, "LOGIN_DNI", "Inicio de sesión rápido con DNI", user.id, ip)
    
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": True, "code": "INVALID_TOKEN_TYPE", "message": "Se requiere refresh token"},
        )
    
    user_id = decoded.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id), User.activo == True).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": True, "code": "USER_NOT_FOUND", "message": "Usuario no encontrado"},
        )
        
    # --- AUDITORÍA DE REFRESCO ---
    log_activity(db, "TOKEN_REFRESH", "El usuario ha renovado su token de acceso", user.id, get_client_ip(request))
    
    token_data = {"sub": str(user.id), "rol": user.rol}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user