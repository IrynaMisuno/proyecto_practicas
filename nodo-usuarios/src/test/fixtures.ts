// Datos de prueba compartidos por los tests. Emails siempre @example.com.
import { vi } from "vitest";
import type { AuthContextValue } from "../hooks/useAuth";
import type { CurrentUser, PermissionInfo, Role, User } from "../types";

export const permissions: PermissionInfo[] = [
  { key: "users:read", label: "Ver usuarios" },
  { key: "users:write", label: "Crear, editar y eliminar usuarios" },
  { key: "roles:read", label: "Ver roles" },
  { key: "roles:write", label: "Crear, editar y eliminar roles" },
];

export const adminRole: Role = {
  id: "rol-admin",
  name: "Administrador",
  description: "Acceso completo",
  tone: "indigo",
  permissions: ["users:read", "users:write", "roles:read", "roles:write"],
};

export const readerRole: Role = {
  id: "rol-lector",
  name: "Lector",
  description: "",
  tone: "slate",
  permissions: ["users:read"],
};

export const roles = [adminRole, readerRole];

const dates = { created_at: "2026-01-10T12:00:00Z", updated_at: "2026-03-05T12:00:00Z" };

export const ana: User = { id: "u-ana", name: "Ana Pérez", email: "ana@example.com", status: "active", role_id: adminRole.id, ...dates };
export const luis: User = { id: "u-luis", name: "Luis Gómez", email: "luis@example.com", status: "invited", role_id: readerRole.id, ...dates };
const eva: User = { id: "u-eva", name: "Eva Ruiz", email: "eva@example.com", status: "suspended", role_id: readerRole.id, ...dates };

export const users = [ana, luis, eva];

/** Sesión de Ana, administradora. */
export const currentAdmin: CurrentUser = { ...ana, role_name: adminRole.name, permissions: adminRole.permissions };

/** Valor simulado de useAuth: administradora con sesión, salvo lo que se sobrescriba. */
export function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: currentAdmin,
    loading: false,
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    can: () => true,
    ...overrides,
  };
}
