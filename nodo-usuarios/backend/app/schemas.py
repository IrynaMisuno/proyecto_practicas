import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, AwareDatetime, BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from .models import PERMISSIONS

UserStatus = Literal["active", "invited", "suspended"]
RoleTone = Literal["slate", "mint", "sky", "violet", "amber", "rose"]

PASSWORD_MIN_LENGTH = 10
PASSWORD_MAX_LENGTH = 128


def validate_password(value: str) -> str:
    problems = []
    if len(value) < PASSWORD_MIN_LENGTH:
        problems.append(f"al menos {PASSWORD_MIN_LENGTH} caracteres")
    if not re.search(r"[a-z]", value):
        problems.append("una minúscula")
    if not re.search(r"[A-Z]", value):
        problems.append("una mayúscula")
    if not re.search(r"[0-9]", value):
        problems.append("un número")
    if not re.search(r"[^A-Za-z0-9]", value):
        problems.append("un símbolo")
    if problems:
        listed = problems[0] if len(problems) == 1 else ", ".join(problems[:-1]) + " y " + problems[-1]
        raise ValueError(f"La contraseña debe tener {listed}.")
    return value


def validate_permissions(value: list[str]) -> list[str]:
    unknown = [permission for permission in value if permission not in PERMISSIONS]
    if unknown:
        raise ValueError(f"Permisos desconocidos: {', '.join(unknown)}.")
    # Conserva el orden del catálogo y elimina repetidos.
    return [permission for permission in PERMISSIONS if permission in value]


Password = Annotated[str, Field(max_length=PASSWORD_MAX_LENGTH), AfterValidator(validate_password)]
Email = Annotated[EmailStr, AfterValidator(lambda value: value.lower())]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
RoleName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=160)]
Permissions = Annotated[list[str], AfterValidator(validate_permissions)]


class StrictModel(BaseModel):
    # Rechaza campos desconocidos: nadie puede colar password_hash, id o fechas.
    model_config = ConfigDict(extra="forbid")


class LoginRequest(StrictModel):
    email: EmailStr
    password: str = Field(max_length=PASSWORD_MAX_LENGTH)
    # «Recordarme en este equipo»: la sesión dura REMEMBER_DAYS y sobrevive al cierre del navegador.
    remember: bool = False


class ForgotPasswordRequest(StrictModel):
    email: EmailStr


class ResetPasswordRequest(StrictModel):
    token: str = Field(min_length=1, max_length=128)
    password: Password


class MessageOut(BaseModel):
    message: str


class UserCreate(StrictModel):
    """Alta por invitación: la persona elige su contraseña con el enlace que recibe por email."""
    name: Name
    email: Email
    role_id: str


class UserUpdate(StrictModel):
    name: Name | None = None
    email: Email | None = None
    password: Password | None = None
    role_id: str | None = None
    status: UserStatus | None = None
    # Bloqueo optimista: el `updated_at` del usuario cuando se abrió el formulario. Si alguien lo ha
    # cambiado desde entonces, la API responde 412 en lugar de sobrescribir sus cambios.
    expected_updated_at: AwareDatetime | None = None


class RoleCreate(StrictModel):
    name: RoleName
    description: Description = ""
    tone: RoleTone = "slate"
    permissions: Permissions = []


class RoleUpdate(StrictModel):
    name: RoleName | None = None
    description: Description | None = None
    tone: RoleTone | None = None
    permissions: Permissions | None = None


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    tone: str
    permissions: list[str]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    status: UserStatus
    role_id: str
    created_at: datetime
    updated_at: datetime


class CurrentUser(UserOut):
    role_name: str
    permissions: list[str]


class PermissionOut(BaseModel):
    key: str
    label: str
