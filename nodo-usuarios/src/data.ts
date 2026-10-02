import type { Role, RoleDraft, User, UserDraft } from "./types";

const API_BASE_URL = "http://localhost:3001";

export interface LoginResult {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = payload && typeof payload === "object" && "error" in payload
      ? String(payload.error)
      : `La API respondió con el estado ${response.status}.`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function loadUsers(): Promise<User[]> {
  const users = await request<User[]>("/users");
  return users.map((user) => ({ ...user, updatedAt: user.updatedAt || new Date().toISOString() }));
}

export function loadRoles(): Promise<Role[]> {
  return request<Role[]>("/roles");
}

export function createUser(draft: UserDraft, password: string): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify({ ...draft, password, id: crypto.randomUUID() }),
  });
}

export async function updateUser(userId: string, draft: UserDraft): Promise<User> {
  const user = await request<User>(`/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(draft),
  });
  return { ...user, updatedAt: user.updatedAt || new Date().toISOString() };
}

export function deleteUser(userId: string): Promise<User> {
  return request<User>(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

export function createRole(draft: RoleDraft): Promise<Role> {
  return request<Role>("/roles", {
    method: "POST",
    body: JSON.stringify({ ...draft, id: crypto.randomUUID() }),
  });
}

export function updateRole(roleId: string, draft: RoleDraft): Promise<Role> {
  return request<Role>(`/roles/${encodeURIComponent(roleId)}`, {
    method: "PATCH",
    body: JSON.stringify(draft),
  });
}

export function deleteRole(roleId: string): Promise<Role> {
  return request<Role>(`/roles/${encodeURIComponent(roleId)}`, { method: "DELETE" });
}

export function verifyDemoCredentials(identifier: string, password: string): Promise<LoginResult> {
  return request<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}
