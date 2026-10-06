from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.database import Base, alembic_config, make_engine, run_migrations

# Esquema de una base de datos creada con create_all antes de usar Alembic y antes de añadir
# password_changed_at, session_version y la tabla invitation_sends.
LEGACY_SCHEMA = [
    """CREATE TABLE roles (
        id VARCHAR(36) NOT NULL PRIMARY KEY, name VARCHAR(40) NOT NULL UNIQUE, description VARCHAR(160) NOT NULL,
        tone VARCHAR(16) NOT NULL, permissions JSON NOT NULL)""",
    """CREATE TABLE users (
        id VARCHAR(36) NOT NULL PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(254) NOT NULL,
        password_hash VARCHAR(255) NOT NULL, status VARCHAR(16) NOT NULL,
        role_id VARCHAR(36) NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
        created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL)""",
    "CREATE UNIQUE INDEX ix_users_email ON users (email)",
    """CREATE TABLE password_reset_tokens (
        id VARCHAR(36) NOT NULL PRIMARY KEY, user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE, expires_at DATETIME NOT NULL, used_at DATETIME, created_at DATETIME NOT NULL)""",
    "CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens (user_id)",
]


@pytest.fixture
def empty_engine(tmp_path: Path) -> Iterator[Engine]:
    """Una base de datos vacía, distinta de la que usan las pruebas de la API."""
    engine = make_engine(f"sqlite:///{tmp_path / 'migraciones.db'}")
    yield engine
    engine.dispose()


def head_revision() -> str:
    return ScriptDirectory.from_config(alembic_config()).get_current_head()


def current_revision(engine: Engine) -> str | None:
    with engine.connect() as connection:
        return MigrationContext.configure(connection).get_current_revision()


def schema_differences(engine: Engine) -> list:
    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"compare_type": True})
        return compare_metadata(context, Base.metadata)


# --- Migraciones -------------------------------------------------------------

def test_migrations_create_the_schema_of_the_models(empty_engine: Engine):
    run_migrations(empty_engine)

    assert current_revision(empty_engine) == head_revision()
    # Si falla, has cambiado app/models.py sin crear la migración: npm run db:revision -- "mensaje".
    assert schema_differences(empty_engine) == []


def test_run_migrations_twice_changes_nothing(empty_engine: Engine):
    run_migrations(empty_engine)
    run_migrations(empty_engine)

    assert current_revision(empty_engine) == head_revision()


def test_migrations_downgrade_to_empty_and_upgrade_again(empty_engine: Engine):
    run_migrations(empty_engine)
    config = alembic_config()
    with empty_engine.begin() as connection:
        config.attributes["connection"] = connection
        command.downgrade(config, "base")

    assert set(inspect(empty_engine).get_table_names()) == {"alembic_version"}

    run_migrations(empty_engine)
    assert schema_differences(empty_engine) == []


def create_legacy_database(engine: Engine, role_of_user: str = "r1") -> None:
    with engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")  # para poder simular una referencia rota
        for statement in LEGACY_SCHEMA:
            connection.execute(text(statement))
        connection.execute(text(
            "INSERT INTO roles VALUES ('r1', 'Viejo índigo', '', 'indigo', '[]'), ('r2', 'Viejo esmeralda', '', 'emerald', '[]')"
        ))
        connection.execute(text(
            "INSERT INTO users VALUES ('u1', 'Persona', 'persona@example.com', 'hash', 'active', :role, '2026-01-01', '2026-01-01')"
        ), {"role": role_of_user})
        connection.commit()
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")


def test_legacy_database_is_adopted_without_losing_data(empty_engine: Engine, tmp_path: Path):
    create_legacy_database(empty_engine)

    run_migrations(empty_engine)

    assert current_revision(empty_engine) == head_revision()
    # Mismo esquema que una base de datos nueva, con los nombres de las restricciones.
    assert schema_differences(empty_engine) == []
    assert not [name for name in inspect(empty_engine).get_table_names() if name.startswith("_legacy_")]
    with empty_engine.connect() as connection:
        user = connection.execute(text("SELECT email, role_id, session_version, password_changed_at FROM users")).one()
        tones = dict(connection.execute(text("SELECT name, tone FROM roles")).all())
        foreign_keys = connection.exec_driver_sql("PRAGMA foreign_keys").scalar()
    assert tuple(user) == ("persona@example.com", "r1", 0, None)
    assert tones == {"Viejo índigo": "violet", "Viejo esmeralda": "mint"}
    assert foreign_keys == 1
    assert (tmp_path / "migraciones-antes-de-alembic.db").exists()


def test_legacy_database_with_broken_references_is_left_untouched(empty_engine: Engine):
    create_legacy_database(empty_engine, role_of_user="no-existe")

    with pytest.raises(RuntimeError, match="referencias rotas"):
        run_migrations(empty_engine)

    tables = set(inspect(empty_engine).get_table_names())
    assert tables == {"roles", "users", "password_reset_tokens"}
    with empty_engine.connect() as connection:
        assert connection.execute(text("SELECT count(*) FROM users")).scalar() == 1
