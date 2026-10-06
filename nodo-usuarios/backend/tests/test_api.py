from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Role, User
from app.security import COOKIE_NAME

from .conftest import ADMIN, STRONG_PASSWORD, create_user, role_id


def login(client: TestClient, email: str, password: str = STRONG_PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


# --- Autenticación ---------------------------------------------------------

def test_login_sets_secure_httponly_cookie_and_returns_permissions(client: TestClient):
    response = login(client, ADMIN["email"], ADMIN["password"])
    assert response.status_code == 200
    body = response.json()
    assert body["role_name"] == "Administrador"
    assert set(body["permissions"]) == {"users:read", "users:write", "roles:read", "roles:write"}
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=strict" in cookie and "secure" in cookie
    assert client.get("/api/auth/me").json()["email"] == ADMIN["email"]


def session_expires_in(client: TestClient) -> timedelta:
    token = client.cookies.get(COOKIE_NAME, path="/api")
    expires = datetime.fromtimestamp(jwt.decode(token, options={"verify_signature": False})["exp"], UTC)
    return expires - datetime.now(UTC)


def test_login_without_remember_uses_browser_session_cookie(client: TestClient):
    response = client.post("/api/auth/login", json=ADMIN)

    assert response.status_code == 200
    # Sin Max-Age ni Expires: el navegador la borra al cerrarse.
    cookie = response.headers["set-cookie"].lower()
    assert "max-age" not in cookie and "expires" not in cookie
    assert timedelta(minutes=59) < session_expires_in(client) <= timedelta(minutes=60)


def test_login_with_remember_keeps_session_for_30_days(client: TestClient):
    response = client.post("/api/auth/login", json={**ADMIN, "remember": True})

    assert response.status_code == 200
    assert f"max-age={30 * 24 * 3600}" in response.headers["set-cookie"].lower()
    assert timedelta(days=29, hours=23) < session_expires_in(client) <= timedelta(days=30)
    assert client.get("/api/auth/me").status_code == 200


def test_login_rejects_invalid_remember_value(client: TestClient):
    assert client.post("/api/auth/login", json={**ADMIN, "remember": "quizá"}).status_code == 422


def test_changing_own_password_keeps_remembered_session(client: TestClient):
    client.post("/api/auth/login", json={**ADMIN, "remember": True})
    me = client.get("/api/auth/me").json()

    response = client.patch(f"/api/users/{me['id']}", json={"password": "Nueva-Clave-2026!"})

    assert response.status_code == 200
    assert f"max-age={30 * 24 * 3600}" in response.headers["set-cookie"].lower()
    assert session_expires_in(client) > timedelta(days=29)
    assert client.get("/api/auth/me").status_code == 200


def test_remembered_session_ends_when_password_changes_elsewhere(admin: TestClient):
    user = create_user(admin, "recordada@example.com")
    other = TestClient(admin.app, base_url="https://testserver")
    assert other.post("/api/auth/login", json={"email": "recordada@example.com", "password": STRONG_PASSWORD, "remember": True}).status_code == 200

    assert admin.patch(f"/api/users/{user['id']}", json={"password": "Nueva-Clave-2026!"}).status_code == 200

    assert other.get("/api/auth/me").status_code == 401


def test_login_email_is_case_insensitive(client: TestClient):
    assert login(client, ADMIN["email"].upper(), ADMIN["password"]).status_code == 200


def test_wrong_password_and_unknown_email_get_same_error(client: TestClient):
    wrong = login(client, ADMIN["email"], "Wrong-Pass-999")
    unknown = login(client, "nadie@example.com", "Wrong-Pass-999")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_login_is_throttled_after_repeated_failures(client: TestClient):
    for _ in range(5):
        assert login(client, ADMIN["email"], "Wrong-Pass-999").status_code == 401
    assert login(client, ADMIN["email"], ADMIN["password"]).status_code == 429


def test_logout_clears_session(admin: TestClient):
    assert admin.post("/api/auth/logout").status_code == 204
    assert admin.get("/api/auth/me").status_code == 401


def test_endpoints_require_session(client: TestClient):
    assert client.get("/api/users").status_code == 401
    assert client.get("/api/roles").status_code == 401
    assert client.post("/api/users", json={}).status_code in (401, 422)
    client.cookies.set("nodo_session", "token-falso", path="/api")
    assert client.get("/api/users").status_code == 401


def test_suspended_user_cannot_log_in_and_loses_session(admin: TestClient):
    user = create_user(admin, "lector@example.com")
    admin.patch(f"/api/users/{user['id']}", json={"status": "suspended"})
    admin.post("/api/auth/logout")
    assert login(admin, "lector@example.com").status_code == 403


# --- Usuarios --------------------------------------------------------------

def test_crud_users(admin: TestClient):
    user = create_user(admin, "nueva@example.com")
    assert admin.get(f"/api/users/{user['id']}").json()["email"] == "nueva@example.com"

    updated = admin.patch(f"/api/users/{user['id']}", json={"name": "Nombre editado", "role_id": role_id(admin, "Gestor")})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Nombre editado"

    assert admin.delete(f"/api/users/{user['id']}").status_code == 204
    assert admin.get(f"/api/users/{user['id']}").status_code == 404


def test_responses_never_include_password_data(admin: TestClient):
    user = create_user(admin, "segura@example.com")
    payloads = [user, admin.get("/api/users").json(), admin.get(f"/api/users/{user['id']}").json(), admin.get("/api/auth/me").json()]
    for payload in payloads:
        assert "password" not in str(payload)


def test_passwords_are_stored_with_argon2id(admin: TestClient):
    create_user(admin, "hash@example.com")
    with SessionLocal() as db:
        stored = db.scalar(select(User.password_hash).where(User.email == "hash@example.com"))
    assert stored.startswith("$argon2id$")
    assert STRONG_PASSWORD not in stored


def test_duplicate_email_is_rejected_case_insensitively(admin: TestClient):
    create_user(admin, "repetido@example.com")
    response = admin.post("/api/users", json={"name": "Otra", "email": "REPETIDO@example.com", "role_id": role_id(admin, "Lector")})
    assert response.status_code == 409
    other = create_user(admin, "otro@example.com")
    assert admin.patch(f"/api/users/{other['id']}", json={"email": "Repetido@Example.com"}).status_code == 409


def test_weak_passwords_are_rejected(admin: TestClient):
    user = create_user(admin, "debil@example.com")
    for weak in ["Corta-1", "sinmayusculas-123", "SINMINUSCULAS-123", "SinNumeros-abc", "SinSimbolos123"]:
        response = admin.patch(f"/api/users/{user['id']}", json={"password": weak})
        assert response.status_code == 422, weak
        assert "password" in response.json()["fields"]


def test_password_can_be_changed_with_same_policy(admin: TestClient):
    user = create_user(admin, "cambio@example.com")
    assert admin.patch(f"/api/users/{user['id']}", json={"password": "debil"}).status_code == 422
    assert admin.patch(f"/api/users/{user['id']}", json={"password": "Nueva-Clave-2026"}).status_code == 200
    admin.post("/api/auth/logout")
    assert login(admin, "cambio@example.com", "Nueva-Clave-2026").status_code == 200


def test_unknown_fields_like_password_hash_are_rejected(admin: TestClient):
    user = create_user(admin, "campos@example.com")
    response = admin.patch(f"/api/users/{user['id']}", json={"password_hash": "x"})
    assert response.status_code == 422


def test_invalid_email_and_role_are_rejected(admin: TestClient):
    base = {"name": "X", "role_id": role_id(admin, "Lector")}
    assert admin.post("/api/users", json={**base, "email": "no-es-email"}).status_code == 422
    assert admin.post("/api/users", json={**base, "email": "ok@example.com", "role_id": "no-existe"}).status_code == 422


def test_admin_cannot_delete_or_suspend_themselves(admin: TestClient):
    me = admin.get("/api/auth/me").json()
    assert admin.delete(f"/api/users/{me['id']}").status_code == 409
    assert admin.patch(f"/api/users/{me['id']}", json={"status": "suspended"}).status_code == 409


def test_last_admin_cannot_lose_admin_role(admin: TestClient):
    me = admin.get("/api/auth/me").json()
    response = admin.patch(f"/api/users/{me['id']}", json={"role_id": role_id(admin, "Lector")})
    assert response.status_code == 409
    assert admin.get("/api/auth/me").json()["role_name"] == "Administrador"


# --- Permisos --------------------------------------------------------------

def test_reader_can_read_but_not_write(admin: TestClient):
    create_user(admin, "lector@example.com")
    admin.post("/api/auth/logout")
    assert login(admin, "lector@example.com").status_code == 200

    assert admin.get("/api/users").status_code == 200
    assert admin.get("/api/roles").status_code == 200
    assert admin.post("/api/users", json={"name": "X", "email": "x@example.com", "role_id": role_id(admin, "Lector")}).status_code == 403
    assert admin.post("/api/roles", json={"name": "Nuevo"}).status_code == 403


def test_manager_can_manage_users_but_not_roles(admin: TestClient):
    create_user(admin, "gestor@example.com", role="Gestor")
    admin.post("/api/auth/logout")
    login(admin, "gestor@example.com")
    create_user(admin, "creado-por-gestor@example.com")
    assert admin.post("/api/roles", json={"name": "Nuevo"}).status_code == 403


# --- Roles -----------------------------------------------------------------

def test_crud_roles_with_permissions(admin: TestClient):
    created = admin.post("/api/roles", json={"name": "Auditor", "description": "Solo usuarios", "permissions": ["users:read"]})
    assert created.status_code == 201
    role = created.json()
    assert role["permissions"] == ["users:read"]

    updated = admin.patch(f"/api/roles/{role['id']}", json={"permissions": ["roles:read", "users:read", "users:read"]})
    assert updated.json()["permissions"] == ["users:read", "roles:read"]

    assert admin.delete(f"/api/roles/{role['id']}").status_code == 204


def test_role_validation(admin: TestClient):
    assert admin.post("/api/roles", json={"name": "administrador"}).status_code == 409
    assert admin.post("/api/roles", json={"name": "X", "permissions": ["todo:hacer"]}).status_code == 422
    assert admin.post("/api/roles", json={"name": "   "}).status_code == 422


def test_assigned_role_cannot_be_deleted(admin: TestClient):
    create_user(admin, "asignado@example.com", role="Gestor")
    assert admin.delete(f"/api/roles/{role_id(admin, 'Gestor')}").status_code == 409


def test_removing_admin_permissions_from_only_admin_role_is_blocked(admin: TestClient):
    response = admin.patch(f"/api/roles/{role_id(admin, 'Administrador')}", json={"permissions": ["users:read"]})
    assert response.status_code == 409
    roles = {role["name"]: role for role in admin.get("/api/roles").json()}
    assert "roles:write" in roles["Administrador"]["permissions"]



def test_role_tones_use_the_mint_palette(admin: TestClient):
    assert admin.post("/api/roles", json={"name": "Menta", "tone": "mint"}).json()["tone"] == "mint"
    assert admin.post("/api/roles", json={"name": "Antiguo", "tone": "indigo"}).status_code == 422


def test_dates_are_returned_with_timezone(admin: TestClient):
    user = create_user(admin, "fecha@example.com")
    assert user["created_at"].endswith("Z") or user["created_at"].endswith("+00:00")
