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
- Componentes funcionales con hooks, uno por archivo en `src/components/`.
- Antes de crear piezas nuevas, reutiliza las de `src/components/ui.tsx`: `buttonStyles`, `inputStyles`, `Field`, `FormError`, `Modal`, `Toast`, `RoleBadge`, `StatusBadge`.
- La API se llama solo desde `src/data.ts`. Los errores llegan como `ApiError`: muestra `error.fields[campo]` junto a cada campo y `error.message` con `FormError`.
- Usa `can("permiso")` de `src/auth.tsx` para ocultar lo que el rol no permite.
- Fechas con `formatDate` (`es-ES`).

## Estilos
- Solo clases de utilidad de Tailwind. `src/styles.css` contiene únicamente directivas y estilos base; no añadas CSS propio.
- Diseño mobile-first: los estilos base son para móvil y se amplían con `sm:`, `md:`, `lg:`. Comprueba a 375 px de ancho.
- Paleta: `slate` para neutros, `indigo` para acciones principales y `rose` para errores y borrados.

## Textos
- Toda la interfaz en español, con tuteo y en el tono de los textos actuales.
