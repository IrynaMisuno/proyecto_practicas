import type { CurrentUser, PermissionInfo, Role, RoleDraft, User, UserDraft } from "./types";

const API_BASE_URL = "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

let onUnauthorized: () => void = () => {};

/** Se llama cuando la API responde 401 (sesión caducada o inexistente). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("No se pudo conectar con la API. Comprueba que el backend está en marcha.", 0);
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const body = payload && typeof payload === "object" ? payload as { error?: unknown; fields?: unknown } : {};
    const message = typeof body.error === "string" ? body.error : `La API respondió con el estado ${response.status}.`;
    const fields = body.fields && typeof body.fields === "object" ? body.fields as Record<string, string> : {};
    if (response.status === 401 && !path.startsWith("/auth/")) onUnauthorized();
    throw new ApiError(message, response.status, fields);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const login = (email: string, password: string) => request<CurrentUser>("/auth/login", json("POST", { email, password }));
export const logout = () => request<void>("/auth/logout", { method: "POST" });
export const loadCurrentUser = () => request<CurrentUser>("/auth/me");

export const loadUsers = () => request<User[]>("/users");
export const createUser = (draft: UserDraft) => request<User>("/users", json("POST", draft));
export const updateUser = (userId: string, draft: Partial<UserDraft>) => request<User>(`/users/${encodeURIComponent(userId)}`, json("PATCH", draft));
export const deleteUser = (userId: string) => request<void>(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });

export const loadRoles = () => request<Role[]>("/roles");
export const loadPermissions = () => request<PermissionInfo[]>("/permissions");
export const createRole = (draft: RoleDraft) => request<Role>("/roles", json("POST", draft));
export const updateRole = (roleId: string, draft: Partial<RoleDraft>) => request<Role>(`/roles/${encodeURIComponent(roleId)}`, json("PATCH", draft));
export const deleteRole = (roleId: string) => request<void>(`/roles/${encodeURIComponent(roleId)}`, { method: "DELETE" });

export const requestPasswordReset = (email: string) => request<{ message: string }>("/auth/forgot-password", json("POST", { email }));
export const resetPassword = (token: string, password: string) => request<{ message: string }>("/auth/reset-password", json("POST", { token, password }));
