import threading
from collections.abc import Callable

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.database import SessionLocal
from app.models import User
from app.routers.users import get_user_or_404
from app.rules import ensure_admin_remains

from .conftest import ADMIN, create_user


class Background:
    """Ejecuta una función en otro hilo y guarda su resultado o su excepción."""

    def __init__(self, function: Callable[[], object]) -> None:
        self.result: object = None
        self.error: BaseException | None = None
        self.thread = threading.Thread(target=self._run, args=(function,), daemon=True)
        self.thread.start()

    def _run(self, function: Callable[[], object]) -> None:
        try:
            self.result = function()
        except BaseException as error:  # noqa: BLE001 (se comprueba en la prueba)
            self.error = error

    def is_waiting(self) -> bool:
        self.thread.join(timeout=0.5)
        return self.thread.is_alive()

    def finish(self) -> None:
        self.thread.join(timeout=10)
        assert not self.thread.is_alive(), "la segunda transacción no terminó"


def find_user(db, email: str) -> User:
    return db.scalar(select(User).where(User.email == email))


# --- Último administrador --------------------------------------------------

def test_simultaneous_admin_removals_keep_one_admin(admin: TestClient):
    create_user(admin, "luis@example.com", role="Administrador")
    first, second = SessionLocal(), SessionLocal()
    try:
        # El administrador inicial suspende a Luis y, a la vez, Luis suspende al administrador inicial.
        find_user(first, "luis@example.com").status = "suspended"
        ensure_admin_remains(first)  # se queda con el bloqueo hasta el commit

        def suspend_initial_admin() -> None:
            find_user(second, ADMIN["email"]).status = "suspended"
            ensure_admin_remains(second)
            second.commit()

        other = Background(suspend_initial_admin)
        assert other.is_waiting()  # espera a que termine el primer cambio

        first.commit()
        other.finish()
        assert isinstance(other.error, HTTPException) and other.error.status_code == 409
    finally:
        first.close()
        second.close()

    with SessionLocal() as db:
        assert db.scalars(select(User.email).where(User.status == "active")).all() == [ADMIN["email"]]


# --- Edición simultánea de un usuario ---------------------------------------

def test_editing_the_same_user_waits_for_the_other_edit(admin: TestClient):
    user = create_user(admin, "eva@example.com")
    first, second = SessionLocal(), SessionLocal()
    try:
        get_user_or_404(first, user["id"], for_update=True).name = "Eva Primera"

        other = Background(lambda: get_user_or_404(second, user["id"], for_update=True).name)
        assert other.is_waiting()

        first.commit()
        other.finish()
        assert other.result == "Eva Primera"  # lee lo que guardó la primera edición, no un valor viejo
    finally:
        first.close()
        second.close()


def test_update_with_current_version_is_saved(admin: TestClient):
    user = create_user(admin, "ana2@example.com")

    response = admin.patch(f"/api/users/{user['id']}", json={"name": "Ana Nueva", "expected_updated_at": user["updated_at"]})

    assert response.status_code == 200
    assert response.json()["name"] == "Ana Nueva"
    assert response.json()["updated_at"] != user["updated_at"]


def test_update_with_stale_version_is_rejected_without_changes(admin: TestClient):
    user = create_user(admin, "luis2@example.com")
    # Otro administrador guarda antes un cambio.
    assert admin.patch(f"/api/users/{user['id']}", json={"name": "Luis Cambiado"}).status_code == 200

    response = admin.patch(f"/api/users/{user['id']}", json={"name": "Luis Pisado", "expected_updated_at": user["updated_at"]})

    assert response.status_code == 412
    assert "Otro administrador ha cambiado" in response.json()["error"]
    assert admin.get(f"/api/users/{user['id']}").json()["name"] == "Luis Cambiado"


@pytest.mark.parametrize("value", ["ayer", "2026-10-06T08:00:00"])  # sin zona horaria tampoco
def test_update_rejects_invalid_version(admin: TestClient, value: object):
    user = create_user(admin, "eva2@example.com")

    assert admin.patch(f"/api/users/{user['id']}", json={"expected_updated_at": value}).status_code == 422
