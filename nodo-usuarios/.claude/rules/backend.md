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
- Códigos: 401 sin sesión, 403 sin permiso, 404 no existe, 409 duplicado o regla de integridad, 412 versión desactualizada (`expected_updated_at`), 422 datos no válidos, 429 demasiados intentos.
- Busca y reutiliza helpers como `get_user_or_404`, `ensure_role_exists` y `commit_or_conflict` antes de escribir otros nuevos.
- Usa `HTTP_422_UNPROCESSABLE_CONTENT`, no el nombre antiguo `..._ENTITY`.

## Base de datos
- PostgreSQL en todos los entornos (desarrollo, pruebas, CI y producción). No añadas código específico de otra base de datos.
- El esquema lo cambian solo las migraciones de Alembic: edita `app/models.py`, genera la migración con `npm run db:revision -- "mensaje"`, revísala y súbela en el mismo commit. `tests/test_migrations.py` falla si falta.
- Las fechas son `DateTime(timezone=True)` y se crean con `datetime.now(UTC)`; la sesión de la base de datos va en UTC (`make_engine`).
- Para empezar con una base de datos vacía: detén la API y ejecuta `docker compose down -v`.

## Dependencias
- Añade cada dependencia de producción a `requirements.txt`, y las de pruebas o herramientas a `requirements-dev.txt`, con versión mínima (`paquete>=x.y`). Instálalas con `.venv/bin/pip install -r requirements-dev.txt` y pasa `npm run audit`.
