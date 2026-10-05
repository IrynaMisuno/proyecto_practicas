from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .models import PERMISSIONS, Role, User
from .schemas import validate_password
from .security import hash_password

DEFAULT_ROLES = [
    {"name": "Administrador", "description": "Acceso completo al panel", "tone": "violet", "permissions": list(PERMISSIONS)},
    {"name": "Gestor", "description": "Gestiona usuarios y consulta roles", "tone": "mint", "permissions": ["users:read", "users:write", "roles:read"]},
    {"name": "Lector", "description": "Consulta usuarios y roles sin modificarlos", "tone": "slate", "permissions": ["users:read", "roles:read"]},
]


def seed_database(db: Session) -> None:
    if db.scalar(select(Role).limit(1)) is None:
        db.add_all(Role(**role) for role in DEFAULT_ROLES)
        db.commit()

    if db.scalar(select(User).limit(1)) is not None:
        return

    settings = get_settings()
    if not settings.admin_email or not settings.admin_password:
        raise RuntimeError("La base de datos no tiene usuarios: define ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env.")
    validate_password(settings.admin_password)

    admin_role = db.scalar(select(Role).where(Role.name == "Administrador"))
    if admin_role is None:
        raise RuntimeError("No existe el rol Administrador para crear el usuario inicial.")
    db.add(User(
        name=settings.admin_name,
        email=settings.admin_email.strip().lower(),
        password_hash=hash_password(settings.admin_password),
        role_id=admin_role.id,
    ))
    db.commit()
