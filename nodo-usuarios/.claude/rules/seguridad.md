# Seguridad (todo el proyecto)

Referencias: OWASP ASVS 5.0 (capítulos de autenticación, sesión, control de acceso y validación), OWASP Top 10 y OWASP Cheat Sheets (Password Storage, Forgot Password, Session Management). Al revisar o añadir algo de seguridad, indica qué requisito o fallo del Top 10 cubre (p. ej. «A01 Broken Access Control»).

## Autorización
- Cada endpoint nuevo exige sesión (`CurrentUser`) o un permiso (`require_permission("recurso:accion")`). Solo son públicos el login y la recuperación de contraseña.
- Ocultar un botón en la interfaz no protege nada: la API debe devolver 403 por sí misma.
- Permisos nuevos: añádelos al catálogo en `app/models.py`, al tipo `Permission` en `src/types.ts` y a los roles por defecto de `app/seed.py` si procede.
- Respeta las reglas de integridad: no eliminarse ni desactivarse uno mismo, no borrar roles asignados y que siempre quede un administrador activo (`app/rules.py`).

## Datos de entrada y salida
- Los esquemas de entrada heredan de `StrictModel` (`extra="forbid"`), con longitudes máximas y `Literal` para valores cerrados.
- Las respuestas usan modelos `...Out`: nunca devuelvas `password_hash`, `token_hash` ni `session_version`.
- Nada de SQL construido con f-strings a partir de datos del usuario; usa siempre `select()` con parámetros.
- Emails normalizados a minúsculas (`Email` en `schemas.py`).

## Contraseñas y sesión
- Hash solo con `hash_password` / `verify_password` (Argon2id, `app/security.py`). Nunca guardes ni registres contraseñas en claro.
- La política (10–128 caracteres, mayúscula, minúscula, número y símbolo) vive en `backend/app/schemas.py` y se replica en `src/components/PasswordChecklist.tsx`. Cambia ambas a la vez.
- NIST SP 800-63B desaconseja las reglas de composición (obligar a mayúscula, número o símbolo) y recomienda más longitud y comprobar contraseñas filtradas. La política actual no lo sigue; no la cambies sin que la usuaria lo decida.
- Al cambiar una contraseña llama a `user.password_changed()` (`app/models.py`): incrementa `session_version` y cierra las sesiones abiertas. Un usuario que no esté `active` pierde el acceso en su siguiente petición (`get_current_user`).
- La cookie de sesión es `httpOnly`, `SameSite=Strict` y con path `/api`. No guardes tokens en `localStorage` ni los leas desde JavaScript.
- Los mensajes de login y de `forgot-password` no deben revelar si un email existe.

## Datos personales (RGPD + LOPDGDD)
- Nombre y email son datos personales: guarda solo los campos necesarios y justifica cualquier campo personal nuevo.
- Borrar un usuario debe eliminar también sus datos asociados (p. ej. `PasswordResetToken`), no solo ocultarlo.
- No escribas emails ni nombres en los logs, salvo el enlace de recuperación en desarrollo (`mailer.py` sin SMTP).

## Secretos (Twelve-Factor: configuración en el entorno)
- Los secretos solo van en `backend/.env`. Cada variable nueva va también en `.env.example`, con un valor de ejemplo, y en `app/config.py`.
- No uses credenciales reales en pruebas ni en ejemplos; usa `@example.com`.
- No escribas secretos, tokens ni contraseñas en logs, mensajes de error ni commits.

## Front-end
- No uses `dangerouslySetInnerHTML` ni construyas HTML con cadenas.
- Las peticiones HTTP pasan siempre por `request()` de `src/data.ts` (`credentials: "same-origin"`, manejo del 401 y de `ApiError`). Los componentes no importan `data.ts`: usan los hooks de `src/hooks/`.
- Codifica los ids en las URLs con `encodeURIComponent`.
- Producción: HTTPS y `COOKIE_SECURE=true`.
