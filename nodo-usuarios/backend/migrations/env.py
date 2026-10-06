"""Entorno de Alembic: conecta las migraciones con los modelos y la configuración de la app."""
from logging.config import fileConfig

from alembic import context

from app import models  # noqa: F401  (registra las tablas en Base.metadata)
from app.config import get_settings
from app.database import Base, make_engine

config = context.config
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """`alembic upgrade head --sql`: escribe el SQL en lugar de ejecutarlo."""
    context.configure(
        url=get_settings().database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # La app (run_migrations en app/database.py) pasa su propia conexión; desde la línea de
    # comandos se crea un motor con la DATABASE_URL de backend/.env.
    connection = config.attributes.get("connection")
    if connection is not None:
        _run(connection)
        return

    if config.config_file_name is not None:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
    engine = make_engine(get_settings().database_url)
    with engine.connect() as connection:
        _run(connection)
    engine.dispose()


def _run(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # SQLite casi no admite ALTER TABLE: el modo batch recrea la tabla para cada cambio.
        render_as_batch=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
