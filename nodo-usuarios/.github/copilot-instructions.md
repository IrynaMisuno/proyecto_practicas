# Instrucciones del proyecto

- Aplicación: Nodo, panel de administración de usuarios y roles.
- Front-end: React, TypeScript estricto, Vite y Tailwind CSS 3 (solo clases de utilidad; `src/styles.css` contiene únicamente directivas y base).
- Backend: FastAPI + SQLAlchemy + SQLite en `backend/`. Pruebas con `npm run test:api`.
- Arranque: `npm run api` y `npm run dev` en terminales separados; comprobar con `npm run lint`, `npm run build` y `npm run test:api`.
- Toda validación y autorización se hace en el servidor; la interfaz solo la refleja. Cada endpoint nuevo debe usar `require_permission`.
- Nunca devolver `password_hash` ni aceptar campos desconocidos en la entrada (`StrictModel`).
- La política de contraseñas está en `backend/app/schemas.py` y se replica en `src/components/UserDialog.tsx`; cambiar ambas a la vez.
- Los secretos van en `backend/.env` (no se sube a Git). No usar credenciales reales en pruebas.
- Mantener la interfaz en español, accesible y adaptable a móvil.
