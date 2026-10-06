import logging
import shutil
from collections.abc import Iterator
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import MetaData, create_engine, event, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

# Nombres fijos para índices y restricciones: Alembic los necesita para poder modificarlos o
# borrarlos en migraciones futuras (SQLite no les pone nombre por su cuenta).
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


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


# --- Migraciones (Alembic) ---

BACKEND_DIR = Path(__file__).resolve().parent.parent
# Revisión que corresponde al esquema que tenían las bases de datos creadas antes de usar Alembic.
BASELINE_REVISION = "0001"
BASELINE_TABLES = ("roles", "users", "password_reset_tokens", "invitation_sends")
# Colores de rol que se renombraron al pasar a la paleta menta (nombre antiguo -> nuevo).
RENAMED_TONES = {"indigo": "violet", "emerald": "mint"}

logger = logging.getLogger(__name__)


def alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    return config


def run_migrations(engine: Engine) -> None:
    """Deja la base de datos en la última migración (`alembic upgrade head`)."""
    tables = set(inspect(engine).get_table_names())
    if "users" in tables and "alembic_version" not in tables:
        _adopt_legacy_database(engine)

    config = alembic_config()
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")


def _adopt_legacy_database(engine: Engine) -> None:
    """Pasa a Alembic una base de datos SQLite creada con create_all, sin perder sus datos.

    Se ejecuta una sola vez. Guarda antes una copia del archivo y, en una sola transacción,
    aparta las tablas antiguas, crea las de la revisión inicial con la migración 0001, copia los
    datos y borra las antiguas. Así el esquema queda idéntico al de una base de datos nueva
    (con los nombres de las restricciones), algo que `ALTER TABLE` no permite en SQLite.
    """
    database = engine.url.database
    if engine.dialect.name != "sqlite" or not database or database == ":memory:":
        raise RuntimeError("La base de datos no tiene tabla alembic_version: márcala con `alembic stamp` antes de arrancar.")
    backup = Path(database).with_name(f"{Path(database).stem}-antes-de-alembic{Path(database).suffix}")
    shutil.copy2(database, backup)
    logger.warning("Base de datos anterior a Alembic: se migra y se guarda una copia en %s", backup)

    config = alembic_config()
    with engine.connect() as connection:
        # Fuera de la transacción: con las claves foráneas activas, borrar una tabla antigua
        # borraría en cascada sus filas relacionadas; y sin legacy_alter_table, SQLite cambiaría
        # las referencias de las otras tablas al renombrarla.
        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
        connection.exec_driver_sql("PRAGMA legacy_alter_table=ON")
        connection.exec_driver_sql("BEGIN")  # pysqlite no abre transacción para el DDL por sí solo
        try:
            legacy = [name for name in BASELINE_TABLES if inspect(connection).has_table(name)]
            for name in legacy:
                for index in inspect(connection).get_indexes(name):
                    connection.exec_driver_sql(f'DROP INDEX "{index["name"]}"')
                connection.exec_driver_sql(f'ALTER TABLE "{name}" RENAME TO "_legacy_{name}"')

            config.attributes["connection"] = connection
            command.upgrade(config, BASELINE_REVISION)

            for name in legacy:
                old_columns = {column["name"] for column in inspect(connection).get_columns(f"_legacy_{name}")}
                columns = ", ".join(f'"{column["name"]}"' for column in inspect(connection).get_columns(name) if column["name"] in old_columns)
                connection.exec_driver_sql(f'INSERT INTO "{name}" ({columns}) SELECT {columns} FROM "_legacy_{name}"')
                connection.exec_driver_sql(f'DROP TABLE "_legacy_{name}"')
            for old, new in RENAMED_TONES.items():
                connection.execute(text("UPDATE roles SET tone = :new WHERE tone = :old"), {"old": old, "new": new})

            if connection.exec_driver_sql("PRAGMA foreign_key_check").first() is not None:
                raise RuntimeError("La base de datos antigua tiene referencias rotas; no se ha migrado.")
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.exec_driver_sql("PRAGMA legacy_alter_table=OFF")
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
            connection.commit()
