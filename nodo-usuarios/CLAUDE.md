# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Nodo: panel de administración de usuarios y roles. Front-end React 19 + TypeScript + Vite + Tailwind 4 en `frontend/`; API FastAPI + SQLAlchemy 2 + Alembic + SQLite en `backend/`. Arquitectura, API y medidas de seguridad: `docs/guia-del-proyecto.md`.

Las normas de cada apartado están en `.claude/rules/` y se cargan solas según los archivos que se toquen.

## Comandos (desde `nodo-usuarios/`)

- `npm start`: arranca la API y Vite a la vez en un solo terminal (`concurrently`).
- `npm run api`: arranca FastAPI en `127.0.0.1:8000` (requiere `backend/.venv` y `backend/.env`).
- `npm run dev`: arranca Vite en `localhost:5173`; redirige `/api` al backend (mismo origen, sin CORS).
- `npm run test:api`: pytest del backend. Una prueba: `cd backend && .venv/bin/pytest tests/test_api.py -k nombre_prueba`.
- `npm run db:upgrade`: aplica las migraciones pendientes (`alembic upgrade head`). La API también lo hace al arrancar.
- `npm run db:revision -- "mensaje"`: genera una migración en `backend/migrations/versions/` comparando `models.py` con la base de datos (ejecuta antes `db:upgrade`). Revísala siempre.
- `npm test`: Vitest del front-end en modo vigilancia (`npx vitest run` para una sola pasada). Un archivo: `npx vitest run frontend/components/PasswordChecklist.test.tsx`.
- `npm run lint` y `npm run build` (`tsc -b` + Vite).
- `npm run audit`: busca vulnerabilidades conocidas en las dependencias (`npm audit` y `pip-audit`).

## Normas generales

- Todo en español: textos de la interfaz, mensajes de error de la API, comentarios y commits.
- La validación y la autorización se hacen en el servidor; la interfaz solo las refleja.
- Todo cambio en `backend/app/models.py` va con su migración de Alembic en el mismo commit; `tests/test_migrations.py` falla si falta.
- Si cambias la API, el modelo de datos o una medida de seguridad, actualiza `docs/guia-del-proyecto.md` en el mismo cambio. Mantén coherente `.github/copilot-instructions.md`.
- No subas `backend/.env`, `backend/nodo.db`, `dist/` ni `.pytest_cache/` (ya están en `.gitignore`).
- Commits con Conventional Commits, con la descripción en español: `feat: añade filtro por rol`, `fix: …`, `docs: …`, `test: …`, `refactor: …`.

## Normas de referencia y dónde se aplican

| Norma | Dónde | Detalle |
| --- | --- | --- |
| OWASP ASVS 5.0 y OWASP Top 10 | `backend/app/` (auth, sesión, permisos, entrada) | `.claude/rules/seguridad.md` |
| OWASP Cheat Sheets (Password Storage, Forgot Password, Session Management) | `app/security.py`, `app/routers/auth.py` | `.claude/rules/seguridad.md` |
| NIST SP 800-63B | Política de contraseñas (`schemas.py` + `PasswordChecklist.tsx`) | `.claude/rules/seguridad.md` |
| RGPD + LOPDGDD | Datos personales de usuarios (`models.py`, logs, correos) | `.claude/rules/seguridad.md` |
| WCAG 2.2 AA / EN 301 549 | `frontend/**/*.tsx`, `index.html` | `.claude/rules/accesibilidad.md` |
| PEP 8 | `backend/**/*.py` | `.claude/rules/backend.md` |
| ESLint + TypeScript estricto | `frontend/` | `.claude/rules/frontend.md` |
| The Twelve-Factor App (configuración) | `backend/.env`, `app/config.py` | `.claude/rules/seguridad.md` (Secretos) |

Integración continua: `.github/workflows/ci.yml` (en la raíz del repositorio) ejecuta lint, Vitest, build y pytest en cada push a `main` y en cada pull request.

Pendiente, todavía sin hacer (no lo des por hecho): Ruff para el backend.

## Verificación antes de dar un cambio por terminado

1. `npm run test:api` si tocaste `backend/`.
2. `npx vitest run`, `npm run lint` y `npm run build` si tocaste `frontend/`.
3. Si es un cambio visible, probarlo con `npm start` (o `npm run api` + `npm run dev`): con el administrador y con un rol sin permisos (Lector), a anchura de móvil y solo con teclado.
4. Di qué comprobaste y qué no.
