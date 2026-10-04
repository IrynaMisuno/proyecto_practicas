---
paths:
  - "src/**/*.{ts,tsx}"
  - "index.html"
  - "tailwind.config.cjs"
---

# Front-end (React + TypeScript + Tailwind)

## TypeScript
- Modo estricto, con `noUnusedLocals` y `noUnusedParameters`. Evita `any`; para datos externos usa `unknown` y compruébalos, como en `request()` de `src/data.ts`.
- Importa los tipos con `import type` (`verbatimModuleSyntax` está activo).
- Los tipos de la API van en `src/types.ts` y deben coincidir con los modelos `...Out` de `backend/app/schemas.py`.

## Componentes
- Componentes funcionales, uno por archivo en `src/components/`.
- Lo más atómicos posible: cada componente hace una sola cosa y recibe por props lo que necesita. Si un trozo de JSX se repite o un componente crece demasiado, extráelo a una pieza reutilizable en lugar de copiarlo.
- Los componentes de UI (piezas genéricas sin lógica de negocio ni llamadas a la API: botones, campos, modales, insignias…) se crean en `src/components/ui/`, uno por archivo, y se exportan desde `src/components/ui/index.ts`. Impórtalos siempre desde ahí (`import { Modal } from "./ui"`), nunca desde el archivo concreto.
- Antes de crear una pieza nueva, reutiliza las que ya hay: `Avatar`, `ConfirmDialog`, `Field`, `FormError`, `IconButton`, `Logo`, `Modal`, `PageHeader`, `RoleBadge`, `StatusBadge`, `Toast` y los estilos `buttonStyles`, `inputStyles`, `linkStyles` y `toneStyles`.
- Botones que solo tienen icono: usa `IconButton`, que obliga a dar un `label` accesible.
- Usa `can("permiso")` de `useAuth` (`src/hooks/useAuth.tsx`) para ocultar lo que el rol no permite.
- Fechas, iniciales, nombres de estado y orden por nombre: `src/format.ts` (`formatDate`, `getInitials`, `statusLabels`, `compareByName`).

## Llamadas a la API
- Los componentes llaman a la API a través de hooks reutilizables en `src/hooks/` (`useUsers`, `useRoles`…), uno por archivo. Cada hook devuelve los datos, el error y sus operaciones (`reload`, `createUser`…). La sesión está en `useAuth` (con su `AuthProvider`).
- `src/data.ts` sigue siendo el único sitio que hace `fetch` (ver `seguridad.md`): los hooks usan sus funciones y los componentes no lo importan.
- Los errores llegan como `ApiError` (`src/errors.ts`, que los componentes sí pueden importar). Usa `errorMessage(caught, textoPorDefecto)` para el mensaje. Muestra `error.fields[campo]` junto a cada campo y `error.message` con `FormError`.

## Pruebas
- Cada componente tiene su propio test junto a él: `Componente.test.tsx`.
- Con Vitest y React Testing Library: prueba lo que la persona ve y hace (busca por rol y texto accesible, p. ej. `getByRole`), no detalles internos.
- Simula los hooks de la API en los tests; no hagas peticiones reales.
- Simula un hook con `vi.mock("../hooks/useX")` y `vi.mocked(useX).mockReturnValue(...)`. Ejemplo: `src/components/Dashboard.test.tsx`.
- Interacciones con `userEvent` (`@testing-library/user-event`), no con `fireEvent`.
- Datos de prueba compartidos en `src/test/fixtures.ts` (incluido `authValue()` para simular `useAuth`).
- Configuración en `vite.config.ts` (entorno `jsdom`) y `src/test/setup.ts`.

## Estilos
- Solo clases de utilidad de Tailwind. `src/styles.css` contiene únicamente directivas y estilos base; no añadas CSS propio.
- Diseño mobile-first: los estilos base son para móvil y se amplían con `sm:`, `md:`, `lg:`. Comprueba a 375 px de ancho.
- Paleta: `slate` para neutros, `indigo` para acciones principales y `rose` para errores y borrados.

## Textos
- Toda la interfaz en español, con tuteo y en el tono de los textos actuales.
