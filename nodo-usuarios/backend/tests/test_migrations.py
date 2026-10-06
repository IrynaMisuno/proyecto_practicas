from collections.abc import Iterator

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from app.database import Base, alembic_config, make_engine, run_migrations

from .conftest import TEST_DATABASE_URL, reset_database


@pytest.fixture
def empty_engine() -> Iterator[Engine]:
    """La base de datos de pruebas, vacía y sin versión de Alembic."""
    reset_database()
    engine = make_engine(TEST_DATABASE_URL)
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
