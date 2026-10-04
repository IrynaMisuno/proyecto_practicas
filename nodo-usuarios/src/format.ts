import type { UserStatus } from "./types";

export const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
};

export function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

/** Ordena por nombre según las reglas del español (acentos, ñ). */
export function compareByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, "es");
}
