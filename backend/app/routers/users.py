import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, RolEnum
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.services.auth_service import (
    get_current_user,
    require_admin,
    require_admin_or_rrhh,
    hash_password,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserOut])
def list_users(
    rol: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = db.query(User)
    if rol:
        q = q.filter(User.rol == rol)
    if activo is not None:
        q = q.filter(User.activo == activo)
    return q.order_by(User.apellidos).all()


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
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
        pin_hash=hash_password(payload.dni.upper()),  # DNI as default PIN
    )
    if payload.password:
        user.password_hash = hash_password(payload.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "USER_NOT_FOUND", "message": "Usuario no encontrado"},
        )
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "code": "USER_NOT_FOUND", "message": "Usuario no encontrado"},
        )
    update_data = payload.model_dump(exclude_unset=True)

    if "password" in update_data:
        user.password_hash = hash_password(update_data.pop("password"))
        # Regenerate PIN from new DNI if DNI is also changing
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

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: uuid.UUID,
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
    user.activo = False
    db.commit()
