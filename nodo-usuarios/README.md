# Nodo | Administración de usuarios

Panel web para administrar usuarios y roles: inicio de sesión con email y contraseña, alta, edición y baja de usuarios, y roles con permisos.

- **Front-end:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend:** FastAPI + SQLAlchemy 2 + Alembic (migraciones) + SQLite
- **Seguridad:** contraseñas con Argon2id, sesión JWT en cookie httpOnly, permisos comprobados en el servidor

Consulta la [guía del proyecto](docs/guia-del-proyecto.md) para conocer la arquitectura, la API y las medidas de seguridad.

## Requisitos

- Node.js 20 o superior
- Python 3.12 o superior

## Puesta en marcha

### 1. Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install --upgrade pip   # el pip que trae el sistema puede tener vulnerabilidades
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Edita `backend/.env`:

- `SECRET_KEY`: genera una con `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: el primer administrador. Se crea solo la primera vez, cuando la base de datos no tiene usuarios. La contraseña debe cumplir la política (ver abajo).
- `SMTP_*` (opcional): servidor de correo para enviar los enlaces de recuperación de contraseña. Si no lo configuras, el enlace aparece en la consola del backend.

Arranca la API (desde la raíz del proyecto):

```bash
npm run api
```

La API queda en `http://127.0.0.1:8000` y la documentación interactiva en `http://127.0.0.1:8000/docs`. La base de datos se guarda en `backend/nodo.db` y, al arrancar, la API le aplica las migraciones pendientes de Alembic.

### 2. Front-end

En otro terminal:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` e inicia sesión con el administrador de `.env`. Vite redirige `/api` al backend, así que la interfaz y la API comparten origen.

**Atajo:** `npm start` arranca la API y el front-end a la vez en un solo terminal, con la salida de cada uno marcada como `[api]` y `[web]`. Ctrl+C detiene los dos.

### 3. Usuarios para probar

Al arrancar solo existe el administrador de `.env`. Para probar con un rol sin permisos de escritura, crea un usuario Lector:

1. Inicia sesión como administrador.
2. En **Usuarios**, pulsa **Añadir usuario**, pon un email de prueba (p. ej. `lector@example.com`), elige el rol **Lector** y pulsa **Enviar invitación**. El usuario aparece como «Invitado».
3. Sin SMTP configurado, el enlace de invitación sale en la consola del backend (`Enlace de invitación para lector@example.com: …`). Cierra la sesión, abre ese enlace y elige una contraseña que cumpla la política: la cuenta pasa a «Activo».
4. Entra con ese usuario: puede ver usuarios y roles, pero no le aparecen los botones de crear, editar ni eliminar, y la API le responde 403 si lo intenta.

Si el enlace caduca (24 horas), el administrador puede reenviarlo con el botón de la fila del usuario.

No escribas contraseñas reales en el repositorio: las de prueba solo las conoces tú.

## Migraciones de la base de datos

El esquema se gestiona con [Alembic](https://alembic.sqlalchemy.org/). Las migraciones están en `backend/migrations/versions/` y la API aplica las pendientes al arrancar.

Para cambiar el esquema:

1. Edita los modelos en `backend/app/models.py`.
2. `npm run db:upgrade` para tener la base de datos al día.
3. `npm run db:revision -- "añade teléfono a usuarios"` genera la migración comparando los modelos con la base de datos.
4. Revisa el archivo generado (Alembic no detecta los renombrados ni las migraciones de datos) y aplícalo con `npm run db:upgrade` o reiniciando la API.
5. Sube el cambio del modelo y la migración en el mismo commit.

Otros comandos, desde `backend/`: `.venv/bin/alembic current` (versión actual), `.venv/bin/alembic history` y `.venv/bin/alembic downgrade -1` (deshace la última).

Si tu `nodo.db` se creó antes de usar Alembic, la primera vez que arranques la API la convierte sin perder datos y guarda una copia en `backend/nodo-antes-de-alembic.db`.

## Comprobaciones

```bash
npm run test:api   # pruebas del backend (pytest)
npx vitest run     # pruebas del front-end (Vitest)
npm run lint
npm run build
```

GitHub Actions ejecuta estas mismas comprobaciones en cada push a `main` y en cada pull request (`.github/workflows/ci.yml`, en la raíz del repositorio).

## Funciones

- Inicio y cierre de sesión con email y contraseña.
- «¿Has olvidado tu contraseña?»: enlace por correo, válido 30 minutos y de un solo uso. Al cambiar la contraseña se cierran las sesiones abiertas.
- Alta, edición, búsqueda, filtrado y baja de usuarios.
- Roles editables con permisos: `users:read`, `users:write`, `roles:read` y `roles:write`. La interfaz oculta lo que tu rol no permite y la API lo rechaza (403).
- Contraseña: mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo. Se valida en el formulario y en el servidor.
- Emails únicos sin distinguir mayúsculas (409 si ya existe).
- Protecciones: no puedes eliminarte ni desactivarte, no se puede borrar un rol asignado y siempre debe quedar un administrador activo.
