---
paths:
  - "src/**/*.tsx"
  - "index.html"
---

# Accesibilidad (objetivo: WCAG 2.2 AA, que es la base de la norma europea EN 301 549)

Al justificar un cambio de accesibilidad, cita el criterio WCAG (p. ej. «1.4.3 Contraste mínimo», «2.1.1 Teclado», «3.3.1 Identificación de errores»).

## Formularios
- Cada campo tiene una etiqueta visible: usa `Field` de `ui.tsx`. Si no hay etiqueta visible, añade un texto oculto con `sr-only` dentro del `<label>`, como en los filtros de `UsersView.tsx`.
- Marca los errores con `aria-invalid` en el campo y el mensaje con `role="alert"` (ya lo hacen `Field` y `FormError`).
- Pon `autoComplete` correcto: `email`, `current-password`, `new-password`.
- No informes solo con color: acompáñalo de texto. `PasswordChecklist` añade ": cumplido"/": pendiente" con `sr-only`.

## Teclado y foco
- Todo debe poder hacerse solo con teclado. Usa `<button>` y `<a>` reales, nunca `onClick` en un `<div>`.
- Los diálogos usan `Modal`: `role="dialog"`, `aria-modal`, título enlazado, cierre con Escape y foco devuelto al cerrar. No crees diálogos propios.
- No quites el anillo de `:focus-visible` definido en `styles.css`.
- Los botones que solo tienen un icono llevan `aria-label` en español (p. ej. `aria-label="Cerrar"`).

## Contenido
- Tablas con `<th scope="col">`; las columnas de acciones llevan el encabezado en `sr-only`.
- Usa la jerarquía de encabezados (`h1` → `h2`) sin saltos y los landmarks `<main>`, `<nav>` y `<header>`.
- Los avisos que aparecen solos usan `role="status"` (como `Toast`).
- Contraste mínimo 4.5:1 en texto normal. No uses `text-slate-400` para texto que haya que leer, solo para placeholders.
- `<html lang="es">` se mantiene en `index.html`.

## Comprobación
- Recorre el cambio solo con Tab, Shift+Tab, Enter y Escape.
- Prueba con VoiceOver (Cmd+F5 en macOS) en los formularios nuevos.
