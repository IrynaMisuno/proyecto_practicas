# Instrucciones del proyecto

- Aplicación: Nodo, panel de administración de usuarios y roles.
- Front-end: React, TypeScript estricto, Vite y Tailwind CSS 4 (solo clases de utilidad; `frontend/styles.css` contiene únicamente el `@import`, el tema `@theme` y los estilos base).
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL (Docker, `npm run db:start`) en `backend/`. Pruebas con `npm run test:api`.
- Arranque: `npm start` (PostgreSQL en Docker, API y Vite en `https://localhost:5173`); comprobar con `npx vitest run`, `npm run lint`, `npm run build` y `npm run test:api`.
- Toda validación y autorización se hace en el servidor; la interfaz solo la refleja. Cada endpoint nuevo debe usar `require_permission`.
- Nunca devolver `password_hash` ni aceptar campos desconocidos en la entrada (`StrictModel`).
- La política de contraseñas está en `backend/app/schemas.py` y se replica en `frontend/components/PasswordChecklist.tsx`; cambiar ambas a la vez.
- Los secretos van en `backend/.env` (no se sube a Git). No usar credenciales reales en pruebas.
- Componentes del front-end atómicos y reutilizables, cada uno con su test (`Componente.test.tsx`). Los de UI van en `frontend/components/ui/` y se exportan desde su `index.ts`. La API se llama desde hooks en `frontend/hooks/`, que usan `frontend/data.ts`.
- Mantener la interfaz en español, accesible y adaptable a móvil.
