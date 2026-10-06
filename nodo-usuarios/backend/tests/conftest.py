import os
from collections.abc import Iterator
from unittest.mock import patch

import pytest
from sqlalchemy.engine import make_url

# PostgreSQL de docker-compose.yml (npm run db:start); en la CI llega por TEST_DATABASE_URL.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql+psycopg://nodo:nodo@127.0.0.1:5433/nodo_test")
# Cada prueba borra todas las tablas: nunca contra una base de datos que no sea de pruebas.
if not (make_url(TEST_DATABASE_URL).database or "").endswith("_test"):
    raise RuntimeError("TEST_DATABASE_URL debe apuntar a una base de datos cuyo nombre acabe en _test.")
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "Admin-Pass-2026"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.routers import auth  # noqa: E402
from app.security import login_throttle, reset_throttle  # noqa: E402

ADMIN = {"email": "admin@example.com", "password": "Admin-Pass-2026"}
STRONG_PASSWORD = "Strong-Pass-123"


def reset_database() -> None:
    """Borra todas las tablas, también la de versiones de Alembic, para que el lifespan migre desde cero."""
    Base.metadata.drop_all(engine)
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS alembic_version"))


@pytest.fixture
def client() -> Iterator[TestClient]:
    reset_database()
    login_throttle._failures.clear()
    reset_throttle._failures.clear()
    with TestClient(app) as test_client:  # el lifespan aplica las migraciones y la semilla
        yield test_client


@pytest.fixture
def admin(client: TestClient) -> TestClient:
    response = client.post("/api/auth/login", json=ADMIN)
    assert response.status_code == 200
    return client


def role_id(client: TestClient, name: str) -> str:
    return next(role["id"] for role in client.get("/api/roles").json() if role["name"] == name)


def create_user(client: TestClient, email: str, role: str = "Lector", password: str = STRONG_PASSWORD) -> dict:
    """Invita a un usuario y acepta la invitación con `password`, como haría la persona."""
    links: list[str] = []
    with patch.object(auth, "send_invitation_email", lambda to, name, link, hours: links.append(link)):
        response = client.post("/api/users", json={"name": "Persona de prueba", "email": email, "role_id": role_id(client, role)})
    assert response.status_code == 201, response.json()
    token = links[0].split("#token=", 1)[1]
    assert client.post("/api/auth/reset-password", json={"token": token, "password": password}).status_code == 200
    return client.get(f"/api/users/{response.json()['id']}").json()
