from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from ..config import get_settings
from ..deps import CurrentUser, DbSession
from ..mailer import send_invitation_email, send_password_reset_email
from ..models import InvitationSend, PasswordResetToken, User
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
    session_lifetime,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

FORGOT_MESSAGE = "Si el email pertenece a una cuenta activa, recibirás un enlace para restablecer la contraseña."
INVALID_RESET_LINK = "El enlace no es válido o ha caducado. Solicita uno nuevo."
RESET_PATH = "/restablecer-contrasena"
INVITATION_PATH = "/aceptar-invitacion"


def to_current_user(user: User) -> CurrentUserOut:
    return CurrentUserOut.model_validate({
        **{field: getattr(user, field) for field in ("id", "name", "email", "status", "role_id", "created_at", "updated_at")},
        "role_name": user.role.name,
        "permissions": user.permissions,
    })


def set_session_cookie(response: Response, user: User, remember: bool = False) -> None:
    """Sin «Recordarme», la cookie es de sesión: el navegador la borra al cerrarse."""
    settings = get_settings()
    response.set_cookie(
        COOKIE_NAME,
        create_access_token(user.id, user.session_version, remember),
        max_age=int(session_lifetime(remember).total_seconds()) if remember else None,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/api",
    )


def issue_password_link(db: Session, user: User, path: str, lifetime: timedelta) -> str:
    """Crea un enlace de un solo uso para elegir contraseña y anula los anteriores del usuario."""
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    token, token_hash = new_reset_token()
    db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=datetime.now(UTC) + lifetime))
    db.commit()
    # El token va en el fragmento (#): el navegador no lo envía al servidor ni en el Referer.
    return f"{get_settings().frontend_url.rstrip('/')}{path}#token={token}"


def send_invitation(db: Session, user: User, background: BackgroundTasks) -> None:
    settings = get_settings()
    # Límite persistente (no en memoria): la ventana es de 24 horas y sobrevive a los reinicios.
    since = datetime.now(UTC) - timedelta(hours=24)
    sent = db.scalar(select(func.count()).select_from(InvitationSend).where(InvitationSend.user_id == user.id, InvitationSend.sent_at > since))
    if sent >= settings.invite_max_per_day:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Este usuario ya ha recibido {settings.invite_max_per_day} invitaciones en las últimas 24 horas. Vuelve a intentarlo más tarde.",
        )
    db.add(InvitationSend(user_id=user.id))
    hours = settings.invite_token_hours
    link = issue_password_link(db, user, INVITATION_PATH, timedelta(hours=hours))  # guarda también el envío
    background.add_task(send_invitation_email, user.email, user.name, link, hours)


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
    set_session_cookie(response, user, credentials.remember)
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
    link = issue_password_link(db, user, RESET_PATH, timedelta(minutes=get_settings().reset_token_minutes))
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
    # Sirve para recuperar la contraseña (usuarios activos) y para aceptar una invitación (invitados).
    if record is None or record.expires_at < now or user is None or user.status not in ("active", "invited"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_RESET_LINK)

    # El hash (lento a propósito) se calcula antes de reclamar el enlace, para no bloquear la base de datos.
    new_password_hash = hash_password(payload.password)
    # Reclama el enlace de forma atómica: si llegan dos peticiones a la vez con el mismo enlace, solo una
    # actualiza la fila; la otra ya no lo encuentra sin usar y recibe el mismo error.
    claimed = db.execute(update(PasswordResetToken).where(PasswordResetToken.id == record.id, PasswordResetToken.used_at.is_(None)).values(used_at=now))
    if claimed.rowcount != 1:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_RESET_LINK)

    accepting_invitation = user.status == "invited"
    user.password_hash = new_password_hash
    user.password_changed()  # cierra las sesiones abiertas con la contraseña anterior
    if accepting_invitation:
        user.status = "active"
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id, PasswordResetToken.id != record.id))
    db.commit()
    if accepting_invitation:
        return MessageOut(message="Cuenta activada. Ya puedes iniciar sesión.")
    return MessageOut(message="Contraseña actualizada. Ya puedes iniciar sesión.")
