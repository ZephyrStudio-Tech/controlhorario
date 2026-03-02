import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User, RolEnum
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.services.auth_service import (
    get_current_user,
    require_admin,
    require_admin_or_rrhh,
    hash_password,
)
from app.services.log_service import log_activity # <-- EL ESPÍA
from app.services.session_service import get_client_ip

router = APIRouter(prefix="/users", tags=["users"])


class UserSimple(BaseModel):
    id: uuid.UUID
    nombre: str
    apellidos: str
    model_config = {"from_attributes": True}


@router.get("/simple", response_model=List[UserSimple])
def list_users_simple(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_rrhh),
):
    """Lista reducida de usuarios activos (id, nombre, apellidos) para filtros de RRHH."""
    return (
        db.query(User)
        .filter(User.activo == True)
        .order_by(User.apellidos)
        .all()
    )


@router.get("/", response_model=List[UserOut])
def list_users(
    request: Request,
    rol: Optional[RolEnum] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # --- REGISTRO DE AUDITORÍA ---
    log_activity(db, "ADMIN_USER_LIST", "Consultó el listado completo de usuarios", current_user.id, get_client_ip(request))

    q = db.query(User)
    if rol:
        q = q.filter(User.rol == rol)
    if activo is not None:
        q = q.filter(User.activo == activo)
    return q.order_by(User.apellidos).all()


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if payload.email and db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "EMAIL_EXISTS", "message": "El email ya existe"},
        )
    if db.query(User).filter(User.dni == payload.dni.upper()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "DNI_EXISTS", "message": "El DNI ya existe"},
        )
    
    user = User(
        nombre=payload.nombre,
        apellidos=payload.apellidos,
        email=payload.email,
        dni=payload.dni.upper(),
        rol=payload.rol,
        jornada_horas_diarias=payload.jornada_horas_diarias,
        pin_hash=hash_password(payload.dni.upper()),
    )
    if payload.password:
        user.password_hash = hash_password(payload.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)

    # --- REGISTRO DE AUDITORÍA ---
    log_activity(
        db, 
        "ADMIN_CREATE_USER", 
        f"Creó al usuario: {user.nombre} {user.apellidos} (Rol: {user.rol.value})", 
        current_user.id, 
        get_client_ip(request)
    )

    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "USER_NOT_FOUND", "message": "Usuario no encontrado"},
        )
    
    ip = get_client_ip(request)
    update_data = payload.model_dump(exclude_unset=True)
    changes = []

    if "password" in update_data:
        user.password_hash = hash_password(update_data.pop("password"))
        changes.append("contraseña")

    if "dni" in update_data:
        new_dni = update_data["dni"].upper()
        existing = db.query(User).filter(User.dni == new_dni, User.id != user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": True, "code": "DNI_EXISTS", "message": "El DNI ya existe"},
            )
        update_data["dni"] = new_dni
        user.pin_hash = hash_password(new_dni)
        changes.append("DNI/PIN")

    if "email" in update_data and update_data["email"]:
        existing_email = db.query(User).filter(
            User.email == update_data["email"], User.id != user_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": True, "code": "EMAIL_EXISTS", "message": "El email ya existe"},
            )
        changes.append("email")

    for key, value in update_data.items():
        if key not in ["password", "dni", "email"]:
            changes.append(key)
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    # --- REGISTRO DE AUDITORÍA ---
    log_activity(
        db, 
        "ADMIN_UPDATE_USER", 
        f"Actualizó {', '.join(changes)} de {user.nombre} {user.apellidos}", 
        current_user.id, 
        ip
    )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "USER_NOT_FOUND", "message": "Usuario no encontrado"},
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "code": "SELF_DEACTIVATE", "message": "No puedes desactivarte a ti mismo"},
        )
    
    # Lógica para no dejar al sistema sin admins
    if user.rol == RolEnum.admin:
        active_admins = db.query(User).filter(
            User.rol == RolEnum.admin,
            User.activo == True,
            User.id != user_id,
        ).count()
        if active_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": True, "code": "LAST_ADMIN", "message": "No puedes desactivar el último administrador activo"},
            )
            
    user.activo = False
    db.commit()

    # --- REGISTRO DE AUDITORÍA ---
    log_activity(
        db, 
        "ADMIN_DEACTIVATE_USER", 
        f"Desactivó la cuenta de: {user.nombre} {user.apellidos}", 
        current_user.id, 
        get_client_ip(request)
    )