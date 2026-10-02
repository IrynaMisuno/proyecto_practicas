# Nodo | Administración de usuarios

Panel front-end de demostración para administrar usuarios y roles con React, TypeScript, Vite y Tailwind CSS 3.

Consulta la [guía detallada del proyecto](docs/guia-del-proyecto.md) para conocer la arquitectura, los flujos, la API mock, las dependencias y Thunder Client.

## Requisitos

- Node.js 18 o superior
- npm

## Puesta en marcha

```bash
npm install
npm run api:mock
```

En otro terminal, inicia la interfaz:

```bash
npm run dev
```

## Thunder Client y API simulada

La interfaz consume un mock local mientras se desarrolla el backend real. Thunder Client puede probar sus operaciones HTTP directamente:

```bash
npm run api:mock
```

Este comando inicia `http://localhost:3001` y carga los datos de `mock/seed.json`. Abre otro terminal para ejecutar `npm run dev`. Al reiniciar el mock se restaura la base semilla; las operaciones de la colección pueden modificarla mientras siga en marcha.

1. Instala la extensión recomendada `rangav.vscode-thunder-client` si aún no está instalada.
2. Crea y activa un entorno con `baseUrl = http://localhost:3001`.
3. Crea una colección local y configura sus URLs con `{{baseUrl}}`; la lista de rutas y cuerpos está en la [guía detallada](docs/guia-del-proyecto.md#8-thunder-client).
4. Para compartir las peticiones dentro del repositorio, activa **Save to Workspace** en los ajustes de Git Sync de Thunder Client. La extensión guardará su formato nativo en `thunder-tests/`.

Los registros `usr-delete-test` y `role-delete-test` son fixtures temporales para probar borrados.

Credenciales locales de demo: `admin@nodo.local` / `NodoDemo2026!`. El endpoint `/auth/login` es una simulación con credenciales fijas; no genera una sesión segura ni debe exponerse fuera del entorno local.

El mock alimenta tanto las pruebas de Thunder Client como la interfaz. Sus datos se reinician desde `mock/seed.json` cada vez que se inicia `npm run api:mock`.

Para comprobar el proyecto y generar la versión de producción:

```bash
npm run lint
npm run build
npm run preview
```

## Funciones incluidas

- Alta, edición, búsqueda, filtrado y baja de usuarios.
- Contraseña obligatoria al crear usuarios: mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.
- Administración de roles; no se permite eliminar roles que estén asignados.
- Verificación de credenciales de demostración desde «Verificar acceso».
- Usuarios y roles consultados y modificados mediante la API mock local.

Credenciales de demostración: `admin@nodo.local` / `NodoDemo2026!`.

## Seguridad y siguiente paso

Esto es solo una interfaz y una API mock de demostración. El mock almacena las nuevas contraseñas como hash scrypt y no devuelve el hash en sus respuestas, pero el login sigue usando credenciales fijas y devuelve un token ficticio; no hay gestión de sesiones ni autorización real. No uses credenciales reales ni expongas este servicio. Para producción, reemplaza el mock por una API real con autorización por rol, sesiones protegidas y validación del lado servidor.
