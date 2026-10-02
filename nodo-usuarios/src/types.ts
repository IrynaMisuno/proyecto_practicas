export type UserStatus = "active" | "invited" | "suspended";
export type RoleTone = "moss" | "coral" | "gold" | "blue" | "ink";

export interface Role {
  id: string;
  name: string;
  description: string;
  tone: RoleTone;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  department: string;
  roleId: string;
  status: UserStatus;
  updatedAt: string;
}

export type UserDraft = Omit<User, "id" | "updatedAt">;
export type RoleDraft = Omit<Role, "id">;
