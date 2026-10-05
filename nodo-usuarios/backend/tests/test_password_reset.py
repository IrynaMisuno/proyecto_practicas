import logging
import smtplib
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update

from app import mailer
from app.config import get_settings
from app.database import SessionLocal
from app.models import PasswordResetToken
from app.routers import auth

from .conftest import ADMIN, STRONG_PASSWORD, create_user

NEW_PASSWORD = "Recuperada-2026"


@pytest.fixture
def outbox(monkeypatch: pytest.MonkeyPatch) -> list[dict]:
    sent: list[dict] = []
    monkeypatch.setattr(auth, "send_password_reset_email", lambda to, name, link: sent.append({"to": to, "link": link}))
    return sent


def forgot(client: TestClient, email: str):
    return client.post("/api/auth/forgot-password", json={"email": email})


def token_from(mail: dict) -> str:
    return mail["link"].split("#token=", 1)[1]


def reset(client: TestClient, token: str, password: str = NEW_PASSWORD):
    return client.post("/api/auth/reset-password", json={"token": token, "password": password})


def login(client: TestClient, email: str, password: str):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_forgot_password_gives_same_answer_for_unknown_email(client: TestClient, outbox: list[dict]):
    known = forgot(client, ADMIN["email"])
    unknown = forgot(client, "nadie@example.com")
    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()
    assert [mail["to"] for mail in outbox] == [ADMIN["email"]]


def test_link_uses_fragment_and_only_hash_is_stored(client: TestClient, outbox: list[dict]):
    forgot(client, ADMIN["email"])
    link = outbox[0]["link"]
    assert "/restablecer-contrasena#token=" in link
    with SessionLocal() as db:
        stored = db.scalar(select(PasswordResetToken.token_hash))
    assert stored and token_from(outbox[0]) not in stored


def test_full_reset_flow(client: TestClient, outbox: list[dict]):
    forgot(client, ADMIN["email"].upper())
    response = reset(client, token_from(outbox[0]))
    assert response.status_code == 200
    assert login(client, ADMIN["email"], ADMIN["password"]).status_code == 401
    assert login(client, ADMIN["email"], NEW_PASSWORD).status_code == 200


def test_token_is_single_use(client: TestClient, outbox: list[dict]):
    forgot(client, ADMIN["email"])
    token = token_from(outbox[0])
    assert reset(client, token).status_code == 200
    assert reset(client, token, "Otra-Clave-2026").status_code == 400


def test_new_request_invalidates_previous_link(client: TestClient, outbox: list[dict]):
    forgot(client, ADMIN["email"])
    forgot(client, ADMIN["email"])
    assert reset(client, token_from(outbox[0])).status_code == 400
    assert reset(client, token_from(outbox[1])).status_code == 200


def test_expired_and_invalid_tokens_are_rejected(client: TestClient, outbox: list[dict]):
    assert reset(client, "token-inventado").status_code == 400
    forgot(client, ADMIN["email"])
    with SessionLocal() as db:
        db.execute(update(PasswordResetToken).values(expires_at=datetime.now(UTC) - timedelta(minutes=1)))
        db.commit()
    assert reset(client, token_from(outbox[0])).status_code == 400


def test_reset_applies_password_policy(client: TestClient, outbox: list[dict]):
    forgot(client, ADMIN["email"])
    response = reset(client, token_from(outbox[0]), "debil")
    assert response.status_code == 422
    assert "password" in response.json()["fields"]
    # El token sigue siendo válido tras un intento con una contraseña débil.
    assert reset(client, token_from(outbox[0])).status_code == 200


def test_reset_closes_existing_sessions(admin: TestClient, outbox: list[dict]):
    assert admin.get("/api/auth/me").status_code == 200
    forgot(admin, ADMIN["email"])
    reset(admin, token_from(outbox[0]))
    assert admin.get("/api/auth/me").status_code == 401


def test_suspended_users_get_no_link(admin: TestClient, outbox: list[dict]):
    user = create_user(admin, "suspendida@example.com")
    admin.patch(f"/api/users/{user['id']}", json={"status": "suspended"})
    assert forgot(admin, "suspendida@example.com").status_code == 202
    assert outbox == []


def test_requests_are_throttled_per_email(client: TestClient, outbox: list[dict]):
    for _ in range(5):
        assert forgot(client, ADMIN["email"]).status_code == 202
    assert len(outbox) == 3


def test_admin_password_change_closes_that_users_sessions(admin: TestClient):
    create_user(admin, "sesion@example.com")
    other = TestClient(admin.app)
    assert login(other, "sesion@example.com", STRONG_PASSWORD).status_code == 200
    user_id = next(user["id"] for user in admin.get("/api/users").json() if user["email"] == "sesion@example.com")
    admin.patch(f"/api/users/{user_id}", json={"password": "Cambiada-Por-Admin-1"})
    assert other.get("/api/auth/me").status_code == 401


def test_changing_own_password_keeps_session(admin: TestClient):
    me = admin.get("/api/auth/me").json()
    assert admin.patch(f"/api/users/{me['id']}", json={"password": "Mi-Nueva-Clave-1"}).status_code == 200
    assert admin.get("/api/auth/me").status_code == 200


def test_smtp_failure_is_logged_without_the_email(monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture):
    email = "persona@example.com"

    def refuse(*_args, **_kwargs):
        raise smtplib.SMTPRecipientsRefused({email: (550, b"Buzon no disponible")})

    monkeypatch.setattr(get_settings(), "smtp_host", "smtp.example.com")
    monkeypatch.setattr(mailer.smtplib, "SMTP", refuse)
    with caplog.at_level(logging.ERROR, logger="uvicorn.error"):
        mailer.send_password_reset_email(email, "Persona", "http://localhost:5173/restablecer-contrasena#token=x")

    assert "SMTPRecipientsRefused" in caplog.text
    assert email not in caplog.text
