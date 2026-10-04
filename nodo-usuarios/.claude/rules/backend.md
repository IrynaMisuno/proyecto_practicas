---
paths:
  - "backend/**/*.py"
---

# Backend (FastAPI + SQLAlchemy)

## Estructura
- Endpoints en `app/routers/`, montados bajo `/api` en `app/main.py`. Un router por recurso.
- Validación de entrada en `app/schemas.py`; modelos en `app/models.py`; reglas de integridad en `app/rules.py`.
- Usa los tipos anotados que ya existen: `DbSession`, `CurrentUser` (`app/deps.py`) y alias como `Reader`/`Writer` con `require_permission(...)`.

## Convenciones
- Estilo PEP 8, salvo la longitud de línea: el código actual usa líneas largas (hasta ~155 caracteres) y no hace falta partirlas. Todavía no hay Ruff configurado: no lo ejecutes como si existiera.
- Tipado completo con anotaciones (`str | None`, `Annotated[...]`); estilo SQLAlchemy 2 (`select()`, `db.scalars`, `db.get`).
- Errores: `raise HTTPException(status.HTTP_..., "Mensaje en español.")`. El manejador de `main.py` los convierte en `{"error", "fields"}`; no devuelvas otro formato.
- Códigos: 401 sin sesión, 403 sin permiso, 404 no existe, 409 duplicado o regla de integridad, 422 datos no válidos, 429 demasiados intentos.
- Busca y reutiliza helpers como `get_user_or_404`, `ensure_role_exists` y `commit_or_conflict` antes de escribir otros nuevos.
- Usa `HTTP_422_UNPROCESSABLE_CONTENT`, no el nombre antiguo `..._ENTITY`.

## Base de datos
- No hay Alembic: `create_all` solo crea tablas. Si añades una columna a una tabla existente, añádela también en `upgrade_schema` (`app/database.py`) o fallará con bases de datos ya creadas.
- Las fechas se guardan en UTC (`datetime.now(UTC)`); en la salida usa `UtcDatetime`.
- Las claves foráneas de SQLite se activan en `make_engine`; no lo quites.
- Para empezar con una base de datos vacía: detén la API y borra `backend/nodo.db`.

## Dependencias
- Añade cada dependencia nueva a `requirements.txt` con versión mínima (`paquete>=x.y`) e instálala en `backend/.venv`.
