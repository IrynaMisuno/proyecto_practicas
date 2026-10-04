from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response, status
from sqlalchemy import delete, select

from ..config import get_settings
from ..deps import CurrentUser, DbSession
from ..mailer import send_password_reset_email
from ..models import PasswordResetToken, User
from ..schemas import CurrentUser as CurrentUserOut
from ..schemas import ForgotPasswordRequest, LoginRequest, MessageOut, ResetPasswordRequest
from ..security import (
    COOKIE_NAME,
    create_access_token,
    hash_password,
    hash_reset_token,
    login_throttle,
    new_reset_token,
    reset_throttle,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

FORGOT_MESSAGE = "Si el email pertenece a una cuenta activa, recibirás un enlace para restablecer la contraseña."
INVALID_RESET_LINK = "El enlace no es válido o ha caducado. Solicita uno nuevo."


def to_current_user(user: User) -> CurrentUserOut:
    return CurrentUserOut.model_validate({
        **{field: getattr(user, field) for field in ("id", "name", "email", "status", "role_id", "created_at", "updated_at")},
        "role_name": user.role.name,
        "permissions": user.permissions,
    })


def set_session_cookie(response: Response, user: User) -> None:
    settings = get_settings()
    response.set_cookie(
        COOKIE_NAME,
        create_access_token(user.id, user.session_version),
        max_age=settings.token_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/api",
    )


def as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=UTC)


@router.post("/login")
def login(credentials: LoginRequest, request: Request, response: Response, db: DbSession) -> CurrentUserOut:
    email = credentials.email.lower()
    throttle_key = f"{email}|{request.client.host if request.client else ''}"
    if login_throttle.is_blocked(throttle_key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Demasiados intentos fallidos. Espera unos minutos y vuelve a probar.")

    user = db.scalar(select(User).where(User.email == email))
    valid_password = verify_password(credentials.password, user.password_hash if user else None)
    if user is None or not valid_password:
        login_throttle.record_failure(throttle_key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos.")
    if user.status != "active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tu cuenta no está activa. Contacta con un administrador.")

    login_throttle.reset(throttle_key)
    set_session_cookie(response, user)
    return to_current_user(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/api", httponly=True, samesite="strict", secure=get_settings().cookie_secure)


@router.get("/me")
def me(user: CurrentUser) -> CurrentUserOut:
    return to_current_user(user)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: ForgotPasswordRequest, background: BackgroundTasks, db: DbSession) -> MessageOut:
    # La respuesta es siempre la misma para no revelar qué emails están registrados.
    email = payload.email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or user.status != "active" or reset_throttle.is_blocked(email):
        return MessageOut(message=FORGOT_MESSAGE)

    reset_throttle.record_failure(email)
    settings = get_settings()
    # Un enlace nuevo anula los anteriores.
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    token, token_hash = new_reset_token()
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(UTC) + timedelta(minutes=settings.reset_token_minutes),
    ))
    db.commit()

    # El token va en el fragmento (#): el navegador no lo envía al servidor ni en el Referer.
    link = f"{settings.frontend_url.rstrip('/')}/restablecer-contrasena#token={token}"
    background.add_task(send_password_reset_email, user.email, user.name, link)
    return MessageOut(message=FORGOT_MESSAGE)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: DbSession) -> MessageOut:
    now = datetime.now(UTC)
    record = db.scalar(select(PasswordResetToken).where(
        PasswordResetToken.token_hash == hash_reset_token(payload.token),
        PasswordResetToken.used_at.is_(None),
    ))
    user = db.get(User, record.user_id) if record else None
    if record is None or as_utc(record.expires_at) < now or user is None or user.status != "active":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_RESET_LINK)

    user.password_hash = hash_password(payload.password)
    user.password_changed()  # cierra las sesiones abiertas con la contraseña anterior
    record.used_at = now
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id, PasswordResetToken.id != record.id))
    db.commit()
    return MessageOut(message="Contraseña actualizada. Ya puedes iniciar sesión.")
