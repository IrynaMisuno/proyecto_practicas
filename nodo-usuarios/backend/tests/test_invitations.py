from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update

from app.database import SessionLocal
from app.models import PasswordResetToken, User
from app.routers import auth

from .conftest import STRONG_PASSWORD, create_user, role_id


@pytest.fixture
def invitations(monkeypatch: pytest.MonkeyPatch) -> list[dict]:
    sent: list[dict] = []
    monkeypatch.setattr(auth, "send_invitation_email", lambda to, name, link, hours: sent.append({"to": to, "link": link, "hours": hours}))
    return sent


def invite(client: TestClient, email: str, role: str = "Lector"):
    return client.post("/api/users", json={"name": "Persona invitada", "email": email, "role_id": role_id(client, role)})


def token_from(mail: dict) -> str:
    return mail["link"].split("#token=", 1)[1]


def accept(client: TestClient, token: str, password: str = STRONG_PASSWORD):
    return client.post("/api/auth/reset-password", json={"token": token, "password": password})


def login(client: TestClient, email: str, password: str = STRONG_PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


# --- Alta por invitación ---------------------------------------------------

def test_new_user_is_invited_by_email(admin: TestClient, invitations: list[dict]):
    response = invite(admin, "Invitada@Example.com")
    assert response.status_code == 201
    assert response.json()["status"] == "invited"
    assert [mail["to"] for mail in invitations] == ["invitada@example.com"]
    assert "/aceptar-invitacion#token=" in invitations[0]["link"]
    assert invitations[0]["hours"] == 24


def test_create_user_no_longer_accepts_password_or_status(admin: TestClient, invitations: list[dict]):
    base = {"name": "X", "email": "x@example.com", "role_id": role_id(admin, "Lector")}
    for extra in ({"password": STRONG_PASSWORD}, {"status": "active"}):
        response = admin.post("/api/users", json={**base, **extra})
        assert response.status_code == 422, extra
    assert invitations == []


def test_invited_user_cannot_log_in_until_accepting(admin: TestClient, invitations: list[dict]):
    invite(admin, "pendiente@example.com")
    admin.post("/api/auth/logout")
    assert login(admin, "pendiente@example.com").status_code == 401

    response = accept(admin, token_from(invitations[0]))
    assert response.status_code == 200
    assert response.json()["message"] == "Cuenta activada. Ya puedes iniciar sesión."
    assert login(admin, "pendiente@example.com").status_code == 200
    assert admin.get("/api/auth/me").json()["status"] == "active"


def test_invitation_link_is_single_use_and_follows_password_policy(admin: TestClient, invitations: list[dict]):
    invite(admin, "unica@example.com")
    token = token_from(invitations[0])
    weak = accept(admin, token, "debil")
    assert weak.status_code == 422
    assert "password" in weak.json()["fields"]
    assert accept(admin, token).status_code == 200
    assert accept(admin, token, "Otra-Clave-2026").status_code == 400


def test_invitation_link_expires_after_configured_hours(admin: TestClient, invitations: list[dict]):
    user = invite(admin, "caduca@example.com").json()
    with SessionLocal() as db:
        expires_at = db.scalar(select(PasswordResetToken.expires_at).where(PasswordResetToken.user_id == user["id"]))
        expires_at = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=UTC)
        assert abs(expires_at - (datetime.now(UTC) + timedelta(hours=24))) < timedelta(minutes=1)
        db.execute(update(PasswordResetToken).values(expires_at=datetime.now(UTC) - timedelta(minutes=1)))
        db.commit()
    assert accept(admin, token_from(invitations[0])).status_code == 400


def test_suspended_user_cannot_accept_invitation(admin: TestClient, invitations: list[dict]):
    user = invite(admin, "suspendida@example.com").json()
    admin.patch(f"/api/users/{user['id']}", json={"status": "suspended"})
    assert accept(admin, token_from(invitations[0])).status_code == 400
    with SessionLocal() as db:
        assert db.scalar(select(User.status).where(User.id == user["id"])) == "suspended"


def test_invited_users_get_no_password_reset_link(admin: TestClient, invitations: list[dict], monkeypatch: pytest.MonkeyPatch):
    resets: list[str] = []
    monkeypatch.setattr(auth, "send_password_reset_email", lambda to, name, link: resets.append(to))
    invite(admin, "sin-recuperar@example.com")
    assert admin.post("/api/auth/forgot-password", json={"email": "sin-recuperar@example.com"}).status_code == 202
    assert resets == []



def test_changing_the_email_cancels_the_pending_invitation(admin: TestClient, invitations: list[dict]):
    user = invite(admin, "errata@exmaple.com").json()
    assert admin.patch(f"/api/users/{user['id']}", json={"email": "correcta@example.com"}).status_code == 200
    assert accept(admin, token_from(invitations[0])).status_code == 400


def test_suspending_cancels_the_pending_invitation_even_after_reactivating(admin: TestClient, invitations: list[dict]):
    user = invite(admin, "reactivada@example.com").json()
    admin.patch(f"/api/users/{user['id']}", json={"status": "suspended"})
    admin.patch(f"/api/users/{user['id']}", json={"status": "invited"})
    assert accept(admin, token_from(invitations[0])).status_code == 400


def test_editing_other_fields_keeps_the_pending_invitation(admin: TestClient, invitations: list[dict]):
    user = invite(admin, "sigue@example.com").json()
    # La interfaz envía todos los campos al editar, también el email y el estado sin cambios.
    edit = {"name": "Nombre nuevo", "email": "sigue@example.com", "status": "invited", "role_id": role_id(admin, "Gestor")}
    assert admin.patch(f"/api/users/{user['id']}", json=edit).status_code == 200
    assert accept(admin, token_from(invitations[0])).status_code == 200

# --- Reenvío ---------------------------------------------------------------

def test_resending_invitation_replaces_the_previous_link(admin: TestClient, invitations: list[dict]):
    user = invite(admin, "reenvio@example.com").json()
    response = admin.post(f"/api/users/{user['id']}/invitation")
    assert response.status_code == 202
    assert len(invitations) == 2
    assert accept(admin, token_from(invitations[0])).status_code == 400
    assert accept(admin, token_from(invitations[1])).status_code == 200


def test_invitation_can_only_be_resent_to_invited_users(admin: TestClient, invitations: list[dict]):
    active = create_user(admin, "activa@example.com")
    assert admin.post(f"/api/users/{active['id']}/invitation").status_code == 409
    assert admin.post("/api/users/no-existe/invitation").status_code == 404


def test_resending_invitation_requires_users_write(admin: TestClient, invitations: list[dict]):
    pending = invite(admin, "espera@example.com").json()
    create_user(admin, "lector@example.com")
    admin.post("/api/auth/logout")
    assert admin.post(f"/api/users/{pending['id']}/invitation").status_code == 401
    login(admin, "lector@example.com")
    assert admin.post(f"/api/users/{pending['id']}/invitation").status_code == 403
