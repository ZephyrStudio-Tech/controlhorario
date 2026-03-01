from fastapi import HTTPException, status
from app.models.user import RolEnum


def require_roles(current_user, *roles):
    """Raise 403 if current_user's role is not in the allowed roles list."""
    if current_user.rol not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": True,
                "code": "FORBIDDEN",
                "message": "No tienes permisos para realizar esta acción.",
            },
        )


def is_admin(user) -> bool:
    return user.rol == RolEnum.admin


def is_rrhh_or_admin(user) -> bool:
    return user.rol in (RolEnum.admin, RolEnum.rrhh)


def can_edit_sessions(user) -> bool:
    return user.rol == RolEnum.admin


def can_review_absences(user) -> bool:
    return user.rol in (RolEnum.admin, RolEnum.rrhh)