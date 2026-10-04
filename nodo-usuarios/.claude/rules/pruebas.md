---
paths:
  - "backend/tests/**/*.py"
  - "backend/app/**/*.py"
---

# Pruebas del backend (pytest)

- Ejecuta con `npm run test:api`, o una sola prueba con `cd backend && .venv/bin/pytest tests/test_api.py -k nombre`.
- `tests/conftest.py` define las variables de entorno **antes** de importar la app. No importes `app.*` en un archivo de pruebas antes de que se cargue `conftest`.
- Fixtures: `client` (base de datos limpia, semilla y límites de intentos reiniciados) y `admin` (cliente con sesión de administrador). Para preparar datos usa `create_user` y `role_id`, también de `conftest.py`.
- Usa `STRONG_PASSWORD` y emails `@example.com`; nunca datos reales.
- Nombres descriptivos en inglés como los existentes (`test_<qué>_<resultado esperado>`), agrupados con comentarios `# --- Sección ---`.

## Qué probar en cada endpoint nuevo o modificado
- El caso correcto, con su código (200/201/204) y el cuerpo de la respuesta.
- 401 sin sesión y 403 con un rol sin el permiso (p. ej. `Lector`).
- 422 con datos no válidos y con un campo desconocido (`StrictModel`).
- 409 en duplicados y en las reglas de integridad.
- Que la respuesta no incluya `password_hash` ni otros campos sensibles.
- Si toca la sesión o la contraseña: que las sesiones anteriores dejan de valer.

Un cambio en `backend/app/` sin una prueba que lo cubra no está terminado.
