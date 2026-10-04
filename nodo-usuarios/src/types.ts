export type UserStatus = "active" | "invited" | "suspended";
export type RoleTone = "slate" | "indigo" | "emerald" | "amber" | "rose" | "sky";
export type Permission = "users:read" | "users:write" | "roles:read" | "roles:write";

export interface Role {
  id: string;
  name: string;
  description: string;
  tone: RoleTone;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  role_id: string;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser extends User {
  role_name: string;
  permissions: Permission[];
}

export interface PermissionInfo {
  key: Permission;
  label: string;
}

export interface UserDraft {
  name: string;
  email: string;
  role_id: string;
  status: UserStatus;
  password?: string;
}

export type RoleDraft = Omit<Role, "id">;
