# Instrucciones del proyecto

- Aplicación: Nodo, panel de administración de usuarios y roles.
- Stack: React, TypeScript estricto, Vite y Tailwind CSS 3.
- Ejecutar `npm install`, `npm run api:mock` y `npm run dev` (los dos últimos en terminales separados); comprobar con `npm run lint` y `npm run build`.
- La interfaz consume la API mock de `mock/server.cjs` a través de `src/data.ts`; no reintroducir persistencia `localStorage` para usuarios o roles.
- Mantener credenciales fuera del almacenamiento de usuarios. La verificación incluida es solo de demostración y no sustituye una API de autenticación.
- Mantener los datos de prueba en `mock/seed.json`; el servidor restaura esa semilla al arrancar. No usar secretos reales.
- Mantener la interfaz en español, accesible y adaptable a móvil.
