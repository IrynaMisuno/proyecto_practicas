import secrets
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..deps import DbSession, RememberedSession, require_permission
from ..models import PasswordResetToken, Role, User
from ..rules import ensure_admin_remains
from ..schemas import MessageOut, UserCreate, UserOut, UserUpdate
from ..security import hash_password
from .auth import send_invitation, set_session_cookie

router = APIRouter(prefix="/users", tags=["users"])

Reader = Annotated[User, Depends(require_permission("users:read"))]
Writer = Annotated[User, Depends(require_permission("users:write"))]

DUPLICATE_EMAIL = "Ya existe un usuario con ese email."


def get_user_or_404(db: Session, user_id: str, for_update: bool = False) -> User:
    # for_update bloquea la fila hasta el final de la transacción (otra edición del mismo usuario
    # espera) y la vuelve a leer aunque ya estuviera cargada, p. ej. si te editas a ti mismo.
    user = db.get(User, user_id, with_for_update={"of": User} if for_update else None, populate_existing=for_update)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado.")
    return user


def ensure_role_exists(db: Session, role_id: str) -> None:
    if db.get(Role, role_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El rol seleccionado no existe.")


def ensure_email_available(db: Session, email: str, user_id: str | None = None) -> None:
    existing = db.scalar(select(User.id).where(User.email == email))
    if existing is not None and existing != user_id:
        raise HTTPException(status.HTTP_409_CONFLICT, DUPLICATE_EMAIL)


def commit_or_conflict(db: Session) -> None:
    # La restricción UNIQUE de la base de datos cubre las altas simultáneas.
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, DUPLICATE_EMAIL) from None


@router.get("")
def list_users(db: DbSession, _: Reader) -> list[UserOut]:
    users = db.scalars(select(User).order_by(User.name)).all()
    return [UserOut.model_validate(user) for user in users]


@router.get("/{user_id}")
def get_user(user_id: str, db: DbSession, _: Reader) -> UserOut:
    return UserOut.model_validate(get_user_or_404(db, user_id))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, background: BackgroundTasks, db: DbSession, _: Writer) -> UserOut:
    ensure_role_exists(db, payload.role_id)
    ensure_email_available(db, payload.email)
    user = User(
        name=payload.name,
        email=payload.email,
        # Contraseña aleatoria que nadie conoce: no se puede entrar hasta aceptar la invitación.
        password_hash=hash_password(secrets.token_urlsafe(32)),
        role_id=payload.role_id,
        status="invited",
    )
    db.add(user)
    commit_or_conflict(db)
    send_invitation(db, user, background)
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/{user_id}/invitation", status_code=status.HTTP_202_ACCEPTED)
def resend_invitation(user_id: str, background: BackgroundTasks, db: DbSession, _: Writer) -> MessageOut:
    user = get_user_or_404(db, user_id)
    if user.status != "invited":
        raise HTTPException(status.HTTP_409_CONFLICT, "Solo se puede reenviar la invitación a usuarios invitados.")
    send_invitation(db, user, background)  # el enlace nuevo anula el anterior
    return MessageOut(message="Invitación reenviada.")


@router.patch("/{user_id}")
def update_user(user_id: str, payload: UserUpdate, response: Response, db: DbSession, current: Writer, remembered: RememberedSession) -> UserOut:
    user = get_user_or_404(db, user_id, for_update=True)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    expected = changes.pop("expected_updated_at", None)
    if expected is not None and expected != user.updated_at:
        raise HTTPException(
            status.HTTP_412_PRECONDITION_FAILED,
            f"Otro administrador ha cambiado a {user.name} mientras lo editabas. Vuelve a abrirlo para ver sus cambios.",
        )

    if user.id == current.id and changes.get("status", "active") != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "No puedes desactivar tu propia cuenta.")
    if "role_id" in changes:
        ensure_role_exists(db, changes["role_id"])
    if "email" in changes:
        ensure_email_available(db, changes["email"], user.id)
    password_changed = "password" in changes
    if password_changed:
        user.password_hash = hash_password(changes.pop("password"))
        # Cierra sus sesiones abiertas.
        user.password_changed()
    # Un enlace pendiente (recuperación o invitación) deja de valer si cambia la contraseña, si se
    # suspende la cuenta o si cambia el email: se envió a la dirección anterior, quizá equivocada.
    email_changed = changes.get("email", user.email) != user.email
    if password_changed or email_changed or changes.get("status") == "suspended":
        db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))

    for field, value in changes.items():
        setattr(user, field, value)
    if "role_id" in changes:
        db.flush()
        db.refresh(user, ["role"])
    ensure_admin_remains(db)
    commit_or_conflict(db)
    db.refresh(user)
    if password_changed and user.id == current.id:
        set_session_cookie(response, user, remembered)  # quien cambia su propia contraseña sigue dentro
    return UserOut.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, db: DbSession, current: Writer) -> None:
    user = get_user_or_404(db, user_id)
    if user.id == current.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "No puedes eliminar tu propia cuenta.")
    db.delete(user)
    ensure_admin_remains(db)
    db.commit()
