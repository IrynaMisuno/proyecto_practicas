import os
import tempfile
from collections.abc import Iterator
from pathlib import Path

import pytest

_db_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_db_dir) / 'test.db'}"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "Admin-Pass-2026"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.security import login_throttle, reset_throttle  # noqa: E402

ADMIN = {"email": "admin@example.com", "password": "Admin-Pass-2026"}
STRONG_PASSWORD = "Strong-Pass-123"


@pytest.fixture
def client() -> Iterator[TestClient]:
    Base.metadata.drop_all(engine)
    login_throttle._failures.clear()
    reset_throttle._failures.clear()
    with TestClient(app) as test_client:  # el lifespan crea las tablas y la semilla
        yield test_client


@pytest.fixture
def admin(client: TestClient) -> TestClient:
    response = client.post("/api/auth/login", json=ADMIN)
    assert response.status_code == 200
    return client


def role_id(client: TestClient, name: str) -> str:
    return next(role["id"] for role in client.get("/api/roles").json() if role["name"] == name)


def create_user(client: TestClient, email: str, role: str = "Lector", **extra) -> dict:
    response = client.post("/api/users", json={
        "name": "Persona de prueba",
        "email": email,
        "password": STRONG_PASSWORD,
        "role_id": role_id(client, role),
        **extra,
    })
    assert response.status_code == 201, response.json()
    return response.json()
