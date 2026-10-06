export type UserStatus = "active" | "invited" | "suspended";
export type RoleTone = "slate" | "mint" | "sky" | "violet" | "amber" | "rose";
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

/** Alta por invitación: la persona elige su contraseña con el enlace del email. */
export interface NewUserDraft {
  name: string;
  email: string;
  role_id: string;
}

export interface UserDraft extends NewUserDraft {
  status: UserStatus;
  password?: string;
}

/** Cambios de un usuario. `expected_updated_at`: su versión al abrir el formulario (bloqueo optimista; 412 si ha cambiado). */
export type UserUpdate = Partial<UserDraft> & { expected_updated_at?: string };

export type RoleDraft = Omit<Role, "id">;
