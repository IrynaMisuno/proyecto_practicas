# Guía del proyecto Nodo

## 1. Propósito y alcance

Nodo es un panel front-end de demostración para administrar usuarios y roles. Está construido con React y TypeScript; las operaciones de lectura y escritura se envían a una API mock local para que el flujo se pueda probar desde el panel y Thunder Client antes de implementar el backend real.

La API mock no es una solución de producción. El login usa una cuenta fija, el token es ficticio y las comprobaciones de permisos no están protegidas en servidor.

## 2. Arquitectura

El recorrido de renderizado es:

1. `index.html` declara el documento y el nodo `#root`.
2. `src/main.tsx` crea la raíz React e importa los estilos globales.
3. `src/App.tsx` compone el panel, carga usuarios y roles, filtra resultados, controla diálogos y coordina mutaciones.
4. `src/components/` contiene los formularios de usuario, rol y verificación de acceso.
5. `src/data.ts` centraliza las llamadas `fetch` a `http://localhost:3001` y traduce errores HTTP a errores utilizables por la interfaz.
6. `mock/server.cjs` implementa la API de demostración sobre `json-server`; `mock/seed.json` es su conjunto de datos inicial.

La interfaz y la API se ejecutan como procesos distintos. La URL de la API se configura actualmente en la constante `API_BASE_URL` de `src/data.ts`.

## 3. Organización de archivos

| Ruta | Responsabilidad |
| --- | --- |
| `src/App.tsx` | Estado de la aplicación, vistas de usuarios/roles, filtros, validaciones de duplicados, confirmaciones y notificaciones. |
| `src/types.ts` | Tipos `User`, `Role`, estados, borradores y colores de rol. |
| `src/data.ts` | Cliente HTTP y funciones para listar, crear, editar, eliminar y verificar acceso. |
| `src/components/UserDialog.tsx` | Alta y edición de usuarios; pide password solo durante el alta. |
| `src/components/RoleDialog.tsx` | Alta y edición de roles. |
| `src/components/AccessDialog.tsx` | Formulario que llama a `POST /auth/login`. |
| `src/styles.css` | Directivas Tailwind, tokens de marca, componentes con `@apply`, estilos responsive y estados visuales específicos. |
| `tailwind.config.cjs` | Rutas de escaneo, colores y fuentes extendidos para Tailwind 3. |
| `postcss.config.cjs` | Integra Tailwind CSS y Autoprefixer en el procesamiento CSS de Vite. |
| `vite.config.ts` | Configura Vite y el plugin de React. |
| `mock/server.cjs` | API REST mock, validación/hash de password, login fijo y filtro de hashes en respuestas. |
| `mock/seed.json` | Usuarios y roles iniciales del entorno de pruebas. |
| `mock/db.json` | Base mutable generada al iniciar el mock; está excluida de Git. |
| `thunder/` | Configuración de pruebas manuales en Thunder Client. |

## 4. Funcionamiento del panel

### Usuarios

- La pantalla inicial consulta `GET /users` y `GET /roles` en paralelo.
- El directorio permite buscar por nombre, correo, usuario o equipo; filtrar por rol y estado; y ordenar por nombre.
- Cada fila permite editar o eliminar. La aplicación confirma antes de borrar.
- El alta y edición comparten formulario. El campo de password solo se muestra al crear.
- El panel comprueba duplicados de correo y nombre de usuario antes de enviar la petición.
- Los errores de red o del mock se presentan como notificaciones; si la API no responde, las acciones se deshabilitan y se ofrece reintentar.

### Contraseña inicial

Al crear un usuario se exige un password de al menos 8 caracteres que incluya una letra mayúscula, una minúscula, un número y un símbolo. El formulario valida el patrón en el navegador y el mock repite la misma validación en el servidor.

El valor viaja únicamente en el cuerpo del `POST /users`. El mock crea una sal aleatoria y guarda `scrypt$<salt>$<hash>` en `mock/db.json`; el campo en claro se elimina antes de persistir. El cliente no lo incorpora al tipo público `User`, y las respuestas de `/users` quitan `passwordHash` antes de enviarse. No hay flujo de cambio/restablecimiento de contraseña en esta demo.

### Roles

- La vista de roles muestra descripción y cantidad de usuarios asignados.
- Se pueden crear y editar roles, y se comprueba que el nombre no esté repetido.
- La interfaz impide borrar roles asignados y conserva al menos un rol.
- Esa protección de borrado existe en el panel, no en el servidor mock; cualquier cliente HTTP directo puede saltársela.

### Verificación de acceso

El formulario de acceso llama a `POST /auth/login`. El mock acepta `admin@nodo.local` con `NodoDemo2026!` y responde con un token demostrativo fijo. Este login no consulta los usuarios creados ni verifica el hash que se genera durante las altas.

## 5. Modelo de datos

### Usuario público

```ts
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  department: string;
  roleId: string;
  status: "active" | "invited" | "suspended";
  updatedAt: string;
}
```

`password` y `passwordHash` no forman parte del objeto de usuario público.

### Rol

```ts
interface Role {
  id: string;
  name: string;
  description: string;
  tone: "moss" | "coral" | "gold" | "blue" | "ink";
}
```

Los tonos solo dan una identidad visual al rol; no representan permisos técnicos.

## 6. API mock

Base URL: `http://localhost:3001`.

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/` | Ver la base completa del mock. |
| `GET` | `/users` | Listar usuarios. |
| `GET` | `/users/:id` | Consultar un usuario. |
| `POST` | `/users` | Crear usuario con campos públicos y `password`; el mock aplica política y hash. |
| `PATCH` | `/users/:id` | Editar campos de usuario y actualizar `updatedAt`. No cambia password. |
| `DELETE` | `/users/:id` | Eliminar usuario. |
| `GET` | `/roles` | Listar roles. |
| `GET` | `/roles/:id` | Consultar un rol. |
| `POST` | `/roles` | Crear rol. |
| `PATCH` | `/roles/:id` | Editar rol. |
| `DELETE` | `/roles/:id` | Eliminar rol; el mock no comprueba asignaciones. |
| `POST` | `/auth/login` | Verificación fija de credenciales demo. |

Ejemplo del cuerpo de alta de usuario:

```json
{
  "name": "Alex García",
  "email": "alex@nodo.local",
  "username": "alexg",
  "department": "Producto",
  "roleId": "role-editor",
  "status": "active",
  "password": "Aa1!bcde"
}
```

El ejemplo de password es de prueba y cumple el mínimo actual de 8 caracteres y las cuatro clases requeridas.

## 7. Datos de prueba y reinicio

Al arrancar, `mock/server.cjs` copia `mock/seed.json` sobre `mock/db.json`. Esto restaura los usuarios y roles iniciales cada vez que se reinicia el proceso. Mientras el mock permanece encendido, las solicitudes `POST`, `PATCH` y `DELETE` modifican la base generada. No edites `mock/db.json` como fuente de datos; cambia `seed.json` si quieres ajustar las fixtures iniciales.

La semilla incluye un usuario y un rol temporales sin asignación para probar los borrados. Las contraseñas nuevas solo existen en la base mutable como hash; las fixtures iniciales no tienen passwords.

## 8. Thunder Client

1. Instala o abre la extensión `rangav.vscode-thunder-client`.
2. Crea un entorno llamado `Nodo local` con `baseUrl = http://localhost:3001` y actívalo.
3. Crea una colección local para las solicitudes de esta API. Usa `{{baseUrl}}` al inicio de cada URL.
4. Añade las rutas de la tabla anterior. Para solicitudes con cuerpo, selecciona JSON.
5. Para probar el alta de usuario, incluye `password` en el `POST /users`; prueba `Aa1!bcde` como valor válido y una cadena sin las clases requeridas para comprobar el `400`.
6. Para login, usa `POST /auth/login` con `{"identifier":"admin@nodo.local","password":"NodoDemo2026!"}`; prueba también una contraseña incorrecta para recibir `401`.

Iniciar el mock antes de enviar solicitudes. Los datos se reinician al detenerlo y volverlo a arrancar.

## 9. Recursos y dependencias

### Runtime de la aplicación

- **React 19 y React DOM**: componentes, estado y renderizado de la interfaz.
- **Lucide React**: iconos de acciones y navegación.
- **Tailwind CSS 3**: utilidades de diseño, con PostCSS y Autoprefixer; `src/styles.css` combina `@apply` con reglas específicas para tablas, diálogos, estados y responsive.

### Herramientas de desarrollo

- **Vite 6** y **@vitejs/plugin-react**: servidor de desarrollo y build.
- **TypeScript 5** y tipos de React/Node: tipado estricto de UI, cliente HTTP y configuración.
- **ESLint 9**, `typescript-eslint` y `@eslint/js`: análisis estático.
- **json-server 0.17**: endpoints REST rápidos para datos locales; `mock/server.cjs` añade la ruta de login y el procesamiento de passwords.
- **PostCSS** y **Autoprefixer**: procesamiento y prefijos del CSS.
- **Thunder Client**: cliente REST dentro de VS Code para enviar requests al mock.

Las versiones declaradas están en `package.json`; `package-lock.json` fija la resolución instalada.

## 10. Comandos

Desde la carpeta raíz del proyecto:

```bash
npm install
```

En un terminal, iniciar la API:

```bash
npm run api:mock
```

En un segundo terminal, iniciar Vite:

```bash
npm run dev
```

Otros comandos:

```bash
npm run lint
npm run build
npm run preview
```

Vite suele mostrar `http://localhost:5173`; si el puerto está ocupado, elegirá otro disponible. El mock usa el puerto `3001`, configurable con `MOCK_API_PORT`.

## 11. Seguridad y límites

Este proyecto es una demo local, no un sistema de identidad listo para producción. El hash scrypt protege los passwords nuevos dentro de los datos de prueba, pero el endpoint de login no los valida: utiliza una credencial fija y un token ficticio. No hay sesiones, autorización real, rate limiting, recuperación de cuenta ni cambio de password. Las validaciones de duplicados y de eliminación de roles asignados viven en la interfaz y no son controles de servidor.

No uses datos personales ni contraseñas reales. Para producción, implementa una API propia que almacene hashes con una política apropiada, verifique credenciales, aplique autorización en cada endpoint y gestione sesiones seguras; después configura `API_BASE_URL` para apuntar a esa API.
