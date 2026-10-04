import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

PERMISSIONS: dict[str, str] = {
    "users:read": "Ver usuarios",
    "users:write": "Crear, editar y eliminar usuarios",
    "roles:read": "Ver roles",
    "roles:write": "Crear, editar y eliminar roles",
}


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(40), unique=True)
    description: Mapped[str] = mapped_column(String(160), default="")
    tone: Mapped[str] = mapped_column(String(16), default="slate")
    permissions: Mapped[list[str]] = mapped_column(JSON, default=list)

    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(16), default="active")
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="RESTRICT"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    # Va dentro del token de sesión; al incrementarlo se cierran todas las sesiones abiertas.
    session_version: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    role: Mapped[Role] = relationship(back_populates="users", lazy="joined")

    def password_changed(self) -> None:
        """Marca el cambio de contraseña y cierra las sesiones abiertas."""
        self.password_changed_at = _now()
        self.session_version = (self.session_version or 0) + 1

    @property
    def permissions(self) -> list[str]:
        return list(self.role.permissions) if self.role else []


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # Solo se guarda el SHA-256 del token: quien lea la base de datos no puede usarlo.
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
