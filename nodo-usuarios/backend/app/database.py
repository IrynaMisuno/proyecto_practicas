from collections.abc import Iterator

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


def make_engine(url: str) -> Engine:
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=connect_args)
    if url.startswith("sqlite"):
        # SQLite no aplica las claves foráneas si no se activa en cada conexión.
        @event.listens_for(engine, "connect")
        def _enable_foreign_keys(dbapi_connection, _record) -> None:
            dbapi_connection.execute("PRAGMA foreign_keys=ON")

    return engine


engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session


# Colores de rol que se renombraron al pasar a la paleta menta (nombre antiguo -> nuevo).
RENAMED_TONES = {"indigo": "violet", "emerald": "mint"}


def upgrade_schema(engine: Engine) -> None:
    """Actualiza bases de datos existentes: añade columnas nuevas (create_all solo crea tablas) y renombra colores de rol."""
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    missing = {
        "password_changed_at": "DATETIME",
        "session_version": "INTEGER NOT NULL DEFAULT 0",
    }
    with engine.begin() as connection:
        for name, definition in missing.items():
            if name not in columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {name} {definition}"))
        for old, new in RENAMED_TONES.items():
            connection.execute(text("UPDATE roles SET tone = :new WHERE tone = :old"), {"old": old, "new": new})
