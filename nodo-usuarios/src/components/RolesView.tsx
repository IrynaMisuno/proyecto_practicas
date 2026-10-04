import { Plus } from "lucide-react";
import type { PermissionInfo, Role, User } from "../types";
import { RoleCard } from "./RoleCard";
import { PageHeader, buttonStyles } from "./ui";

interface RolesViewProps {
  roles: Role[];
  users: User[] | null;
  permissions: PermissionInfo[];
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export function RolesView({ roles, users, permissions, canWrite, onAdd, onEdit, onDelete }: RolesViewProps) {
  const labels = new Map(permissions.map((permission) => [permission.key, permission.label]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Cada rol define qué puede hacer en el panel quien lo tenga asignado."
        action={canWrite && <button type="button" className={buttonStyles.primary} onClick={onAdd}><Plus size={16} /> Crear rol</button>}
      />

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            permissionLabels={labels}
            assigned={users?.filter((user) => user.role_id === role.id).length}
            canWrite={canWrite}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}
