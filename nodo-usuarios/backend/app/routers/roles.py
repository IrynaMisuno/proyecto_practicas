from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..deps import CurrentUser, DbSession, require_permission
from ..models import PERMISSIONS, Role, User
from ..rules import ensure_admin_remains
from ..schemas import PermissionOut, RoleCreate, RoleOut, RoleUpdate

router = APIRouter(tags=["roles"])

Reader = Annotated[User, Depends(require_permission("roles:read"))]
Writer = Annotated[User, Depends(require_permission("roles:write"))]

DUPLICATE_NAME = "Ya existe un rol con ese nombre."


def get_role_or_404(db: Session, role_id: str) -> Role:
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Rol no encontrado.")
    return role


def ensure_name_available(db: Session, name: str, role_id: str | None = None) -> None:
    existing = db.scalar(select(Role.id).where(func.lower(Role.name) == name.lower()))
    if existing is not None and existing != role_id:
        raise HTTPException(status.HTTP_409_CONFLICT, DUPLICATE_NAME)


def commit_or_conflict(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, DUPLICATE_NAME) from None


@router.get("/permissions")
def list_permissions(_: CurrentUser) -> list[PermissionOut]:
    return [PermissionOut(key=key, label=label) for key, label in PERMISSIONS.items()]


# Cualquier usuario autenticado puede listar los roles: el panel los necesita
# para mostrar el rol de cada usuario y rellenar el formulario de alta.
@router.get("/roles")
def list_roles(db: DbSession, _: CurrentUser) -> list[RoleOut]:
    return [RoleOut.model_validate(role) for role in db.scalars(select(Role).order_by(Role.name)).all()]


@router.post("/roles", status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, db: DbSession, _: Writer) -> RoleOut:
    ensure_name_available(db, payload.name)
    role = Role(**payload.model_dump())
    db.add(role)
    commit_or_conflict(db)
    return RoleOut.model_validate(role)


@router.patch("/roles/{role_id}")
def update_role(role_id: str, payload: RoleUpdate, db: DbSession, _: Writer) -> RoleOut:
    role = get_role_or_404(db, role_id)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "name" in changes:
        ensure_name_available(db, changes["name"], role.id)
    for field, value in changes.items():
        setattr(role, field, value)
    ensure_admin_remains(db)
    commit_or_conflict(db)
    return RoleOut.model_validate(role)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: str, db: DbSession, _: Writer) -> None:
    role = get_role_or_404(db, role_id)
    assigned = db.scalar(select(func.count()).select_from(User).where(User.role_id == role.id))
    if assigned:
        raise HTTPException(status.HTTP_409_CONFLICT, "No se puede eliminar un rol asignado a usuarios.")
    db.delete(role)
    db.commit()
