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
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login/email", response_model=TokenResponse)
def login_email(payload: LoginEmail, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.activo == True).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": True, "code": "INVALID_CREDENTIALS", "message": "Credenciales incorrectas"},
        )
    token_data = {"sub": str(user.id), "rol": user.rol}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/login/dni", response_model=TokenResponse)
def login_dni(payload: LoginDNI, db: Session = Depends(get_db)):
    from app.services.auth_service import verify_password as vp
    user = db.query(User).filter(User.dni == payload.dni.upper(), User.activo == True).first()
    if not user or not user.pin_hash or not vp(payload.dni.upper(), user.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": True, "code": "INVALID_CREDENTIALS", "message": "DNI/PIN incorrecto"},
        )
    token_data = {"sub": str(user.id), "rol": user.rol}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
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
    token_data = {"sub": str(user.id), "rol": user.rol}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
