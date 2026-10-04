from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import User

ADMIN_PERMISSIONS = {"users:write", "roles:write"}


def ensure_admin_remains(db: Session) -> None:
    """Tras aplicar un cambio (con flush), comprueba que alguien pueda seguir administrando."""
    db.flush()
    active_users = db.scalars(select(User).where(User.status == "active")).all()
    if not any(ADMIN_PERMISSIONS <= set(user.permissions) for user in active_users):
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Debe quedar al menos un usuario activo con permisos para gestionar usuarios y roles.",
        )
