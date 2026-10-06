from collections.abc import Callable
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import COOKIE_NAME, decode_access_token

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(db: DbSession, session_token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None) -> User:
    claims = decode_access_token(session_token) if session_token else None
    # Se recarga el usuario en cada petición: si lo han borrado, suspendido o le
    # han cambiado la contraseña, su sesión deja de valer aunque no haya caducado.
    user = db.get(User, claims.user_id) if claims else None
    if claims is None or user is None or user.status != "active" or claims.version != user.session_version:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Inicia sesión para continuar.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def is_remembered_session(session_token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None) -> bool:
    """Si la sesión actual se abrió con «Recordarme», para conservarlo al renovar la cookie."""
    claims = decode_access_token(session_token) if session_token else None
    return claims.remember if claims else False


RememberedSession = Annotated[bool, Depends(is_remembered_session)]


def require_permission(permission: str) -> Callable[[User], User]:
    def dependency(user: CurrentUser) -> User:
        if permission not in user.permissions:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permiso para realizar esta acción.")
        return user

    return dependency
