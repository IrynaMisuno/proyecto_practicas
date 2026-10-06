from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import User

ADMIN_PERMISSIONS = {"users:write", "roles:write"}
# Clave del bloqueo de PostgreSQL que pone en fila los cambios que pueden dejar sin administradores.
ADMIN_CHANGES_LOCK = 1_946_201_001


def ensure_admin_remains(db: Session) -> None:
    """Tras aplicar un cambio (con flush), comprueba que alguien pueda seguir administrando.

    El bloqueo dura hasta el final de la transacción: si dos administradores se quitan el permiso
    el uno al otro a la vez, el segundo espera a que el primero termine y ya ve su cambio, en
    lugar de comprobar los dos a la vez un estado que ninguno de los dos va a dejar.
    """
    db.flush()
    db.execute(select(func.pg_advisory_xact_lock(ADMIN_CHANGES_LOCK)))
    active_users = db.scalars(select(User).where(User.status == "active")).all()
    if not any(ADMIN_PERMISSIONS <= set(user.permissions) for user in active_users):
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Debe quedar al menos un usuario activo con permisos para gestionar usuarios y roles.",
        )
