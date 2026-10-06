# Guía del proyecto Nodo

## 1. Propósito

Nodo es un panel de administración de usuarios. Un usuario inicia sesión con su email y contraseña y, según los permisos de su rol, puede consultar o gestionar usuarios y roles. Los datos se guardan en una base de datos SQLite a través de una API FastAPI.

## 2. Arquitectura

```
navegador ──► Vite (localhost:5173) ──/api──► FastAPI (127.0.0.1:8000) ──► SQLite (backend/nodo.db)
```

Vite sirve la interfaz y redirige `/api` al backend (`vite.config.ts`). Así la interfaz y la API comparten origen: la cookie de sesión funciona sin CORS y puede ser `SameSite=Strict`. En producción, un proxy inverso (nginx, Caddy…) debe cumplir el mismo papel y servir todo por HTTPS con `COOKIE_SECURE=true`.

## 3. Organización de archivos

### Backend (`backend/`)

| Ruta | Responsabilidad |
| --- | --- |
| `app/main.py` | Crea la app, registra los routers bajo `/api`, crea las tablas, carga la semilla, traduce errores a `{"error", "fields"}` y añade cabeceras de seguridad. |
| `app/config.py` | Configuración desde `.env` (pydantic-settings). |
| `app/database.py` | Motor SQLAlchemy, sesiones y claves foráneas activadas en SQLite. |
| `app/models.py` | Tablas `roles` y `users` y catálogo de permisos. |
| `app/schemas.py` | Validación de entrada (política de contraseña, email, permisos) y modelos de salida sin datos sensibles. |
| `app/security.py` | Hash Argon2id, JWT, tokens de recuperación y límites de intentos. |
| `app/mailer.py` | Envío del correo de recuperación por SMTP, o el enlace en la consola si no hay SMTP. |
| `app/deps.py` | Usuario actual desde la cookie y `require_permission`. |
| `app/rules.py` | Regla «siempre debe quedar un administrador activo». |
| `app/seed.py` | Roles por defecto y primer administrador desde `.env`. |
| `app/routers/` | Endpoints de autenticación, usuarios y roles. |
| `tests/` | Pruebas con pytest y una base de datos temporal. |

### Front-end (`frontend/`)

| Ruta | Responsabilidad |
| --- | --- |
| `main.tsx` | Monta la app dentro de `AuthProvider`. |
| `App.tsx` | Elige la pantalla: carga, recuperación de contraseña, login o panel. |
| `data.ts` | Cliente HTTP de `/api`: el único que hace `fetch`; convierte los errores en `ApiError` y cierra la sesión ante un 401. |
| `errors.ts` | `ApiError` y `errorMessage()`. |
| `format.ts` | Fechas, iniciales, nombres de estado y orden por nombre. |
| `hooks/useAuth.tsx` | `AuthProvider` y `useAuth`: usuario actual, `login`, `logout`, `can(permiso)`. |
| `hooks/useUsers.ts`, `useRoles.ts`, `usePermissions.ts` | Datos del panel y sus operaciones; llaman a `data.ts`. |
| `hooks/useForgotPassword.ts`, `useResetPassword.ts` | Recuperación de contraseña (`/restablecer-contrasena`) y aceptación de invitaciones (`/aceptar-invitacion`). |
| `hooks/useToast.ts` | Avisos temporales. |
| `components/Dashboard.tsx` | Panel con sesión: secciones, carga de datos y diálogos. |
| `components/Sidebar.tsx` | Navegación y cierre de sesión. |
| `components/UsersView.tsx` | Vista de usuarios: `UserStats`, `UserFilters` y una `UserRow` por usuario. |
| `components/RolesView.tsx` | Vista de roles: una `RoleCard` por rol con sus permisos y usuarios asignados. |
| `components/UserDialog.tsx`, `RoleDialog.tsx` | Formularios de alta y edición, con los errores del servidor junto a cada campo. |
| `components/LoginPage.tsx` | Inicio de sesión con el enlace «¿Has olvidado tu contraseña?». |
| `components/ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` | Solicitud del enlace y elección de la contraseña nueva, o de la primera al aceptar una invitación. |
| `components/PasswordChecklist.tsx` | Requisitos de contraseña en vivo; la misma política que el backend. |
| `components/AuthShell.tsx`, `BackToLogin.tsx` | Marco común de las pantallas sin sesión. |
| `components/ui/` | Piezas genéricas exportadas desde `index.ts`: `Modal`, `ConfirmDialog`, `Field`, `FormError`, `IconButton`, insignias, `Toast`, etc., y los estilos. |
| `test-utils/` | Configuración de Vitest y datos de prueba. Cada componente tiene su `*.test.tsx` al lado. |

## 4. Modelo de datos

**Role**: `id`, `name` (único), `description`, `tone` (color de la insignia: `slate`, `mint`, `sky`, `violet`, `amber` o `rose`), `permissions` (lista).

**User**: `id`, `name`, `email` (único, en minúsculas), `password_hash`, `status` (`active`, `invited`, `suspended`), `role_id`, `created_at`, `updated_at`, `password_changed_at`, `session_version`.

**PasswordResetToken**: `id`, `user_id`, `token_hash` (SHA-256 del token), `expires_at`, `used_at`, `created_at`. Sirve para la recuperación de contraseña y para las invitaciones.

**InvitationSend**: `id`, `user_id`, `sent_at`. Un registro por cada invitación enviada, para el límite diario.

Solo los usuarios `active` pueden iniciar sesión. Al arrancar por primera vez se crean tres roles:

| Rol | Permisos |
| --- | --- |
| Administrador | todos |
| Gestor | `users:read`, `users:write`, `roles:read` |
| Lector | `users:read`, `roles:read` |

## 5. API

Todas las rutas empiezan por `/api`. Salvo el login, todas exigen sesión (401 si no la hay) y las marcadas con un permiso devuelven 403 si el rol no lo tiene.

| Método | Ruta | Permiso | Uso |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | — | `{"email", "password"}`; crea la cookie de sesión. |
| `POST` | `/auth/logout` | — | Borra la cookie. |
| `GET` | `/auth/me` | sesión | Usuario actual con su rol y permisos. |
| `POST` | `/auth/forgot-password` | — | `{"email"}`; responde siempre 202 con el mismo mensaje. |
| `POST` | `/auth/reset-password` | — | `{"token", "password"}`; recupera la contraseña o acepta una invitación (la cuenta pasa a `active`). 400 si el enlace no es válido o ha caducado. |
| `GET` | `/users` | `users:read` | Lista de usuarios. |
| `GET` | `/users/{id}` | `users:read` | Un usuario. |
| `POST` | `/users` | `users:write` | `{"name", "email", "role_id"}`; crea el usuario como `invited` y le envía la invitación por email. No acepta `password` ni `status`. |
| `POST` | `/users/{id}/invitation` | `users:write` | Reenvía la invitación (202) y anula el enlace anterior; 409 si el usuario no está invitado y 429 si ya ha recibido 5 en 24 horas. |
| `PATCH` | `/users/{id}` | `users:write` | Cualquier subconjunto de `{"name", "email", "role_id", "status", "password"}`. |
| `DELETE` | `/users/{id}` | `users:write` | Elimina un usuario. |
| `GET` | `/roles` | sesión | Lista de roles. |
| `POST` | `/roles` | `roles:write` | `{"name", "description", "tone", "permissions"}`. |
| `PATCH` | `/roles/{id}` | `roles:write` | Edita un rol. |
| `DELETE` | `/roles/{id}` | `roles:write` | Elimina un rol sin usuarios asignados. |
| `GET` | `/permissions` | sesión | Catálogo de permisos. |

Los errores tienen la forma `{"error": "mensaje", "fields": {"campo": "mensaje"}}`. Los códigos son: 409 para email o nombre de rol repetido y para las reglas de integridad, 422 para datos no válidos y 429 cuando hay demasiados intentos de login.

## 6. Seguridad

- **Contraseñas**: hash Argon2id (`pwdlib`). Nunca se guardan en claro ni salen en las respuestas.
- **Política**: entre 10 y 128 caracteres, con mayúscula, minúscula, número y símbolo. Se valida en el servidor; el formulario muestra los requisitos en vivo.
- **Sesión**: JWT firmado con `SECRET_KEY`, caduca en 60 minutos (`TOKEN_MINUTES`). Va en una cookie `httpOnly` (JavaScript no puede leerla), `SameSite=Strict` y restringida a `/api`. En cada petición se recarga el usuario: si lo eliminan o lo suspenden, pierde el acceso al momento.
- **Login**: el mensaje es el mismo si el email no existe o la contraseña es incorrecta, y el tiempo de respuesta también. Tras 5 fallos en 15 minutos se bloquea esa combinación de email e IP.
- **Recuperación de contraseña**:
  - `forgot-password` responde siempre lo mismo, exista o no el email, para no revelar qué cuentas hay.
  - Solo se envía el enlace a cuentas activas, como máximo 3 veces cada 15 minutos por email.
  - El token es aleatorio (256 bits) y en la base de datos solo se guarda su SHA-256.
  - Caduca a los 30 minutos (`RESET_TOKEN_MINUTES`), es de un solo uso y pedir uno nuevo anula los anteriores. El enlace se marca como usado con una sola operación atómica: si llegan dos peticiones a la vez con el mismo enlace, solo una lo consigue.
  - Va en el fragmento de la URL (`#token=…`): el navegador no lo envía al servidor ni en el `Referer`, y la interfaz lo borra de la barra de direcciones al abrir la página.
  - Al cambiar la contraseña, por recuperación o desde el panel, se incrementa `session_version` y se cierran todas las sesiones abiertas de ese usuario.
  - Los enlaces pendientes (de recuperación o de invitación) se anulan si cambia la contraseña, si se suspende la cuenta o si cambia el email, porque se enviaron a la dirección anterior.
- **Alta por invitación**:
  - El administrador nunca conoce ni elige la contraseña de otra persona: el usuario se crea como `invited`, con una contraseña aleatoria que nadie conoce, y recibe un enlace para elegir la suya.
  - El enlace usa el mismo mecanismo que la recuperación (token de 256 bits, solo se guarda el SHA-256, un solo uso, en el fragmento de la URL), pero va a `/aceptar-invitacion` y caduca a las 24 horas (`INVITE_TOKEN_HOURS`).
  - Al aceptarla, la cuenta pasa a `active`. Reenviarla anula el enlace anterior.
  - Cada usuario puede recibir como máximo 5 invitaciones (alta + reenvíos) en 24 horas (`INVITE_MAX_PER_DAY`). El límite se guarda en la base de datos (`invitation_sends`), así que sobrevive a los reinicios, y se borra al eliminar el usuario. Un usuario suspendido no puede aceptarla y un invitado no puede pedir el enlace de recuperación.
- **Entrada estricta**: se rechazan los campos desconocidos, así que no se puede enviar `password_hash`, `id` ni fechas.
- **Emails únicos**: se normalizan a minúsculas, y una restricción `UNIQUE` en la base de datos cubre las altas simultáneas.
- **Integridad**: no puedes eliminarte ni desactivarte, no se borran roles asignados y siempre debe quedar un usuario activo con `users:write` y `roles:write`.
- **Cabeceras**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Cache-Control: no-store` en la API.

Correo: sin `SMTP_HOST`, los enlaces de recuperación y de invitación se escriben en la consola del backend. En producción configura `SMTP_*` y `FRONTEND_URL`.

Límites conocidos: el bloqueo de intentos de login y de recuperación vive en memoria (se reinicia con el proceso y no se comparte entre varias instancias); el límite de invitaciones, en cambio, está en la base de datos. El primer arranque sobre una base de datos vacía debe hacerse con un solo proceso: con varios (`--workers`), todos intentan crear las tablas y la semilla a la vez y fallan. Para producción, sirve todo por HTTPS con `COOKIE_SECURE=true` y usa migraciones (Alembic) en lugar de `create_all`.

## 7. Comandos

| Comando | Qué hace |
| --- | --- |
| `npm start` | Arranca la API y Vite a la vez en un solo terminal. |
| `npm run api` | Arranca FastAPI con recarga automática en el puerto 8000. |
| `npm run dev` | Arranca Vite en el puerto 5173. |
| `npm run test:api` | Ejecuta las pruebas del backend. |
| `npm test` | Ejecuta las pruebas del front-end (Vitest) y las repite al guardar; `npx vitest run` para una sola pasada. |
| `npm run lint` / `npm run build` | Análisis estático y compilación del front-end. |

Para empezar con una base de datos vacía, detén la API y borra `backend/nodo.db`; al arrancar de nuevo se crean los roles y el administrador de `.env`.
