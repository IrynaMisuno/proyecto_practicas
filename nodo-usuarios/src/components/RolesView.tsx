import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { PermissionInfo, Role, User } from "../types";
import { buttonStyles, toneStyles } from "./ui";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Roles</h1>
          <p className="mt-1 text-sm text-slate-500">Cada rol define qué puede hacer en el panel quien lo tenga asignado.</p>
        </div>
        {canWrite && <button type="button" className={buttonStyles.primary} onClick={onAdd}><Plus size={16} /> Crear rol</button>}
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const assigned = users?.filter((user) => user.role_id === role.id).length;
          return (
            <li key={role.id} className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white ${toneStyles[role.tone].swatch}`}><ShieldCheck size={18} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-900">{role.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{role.description || "Sin descripción"}</p>
                </div>
                {canWrite && (
                  <div className="flex gap-1">
                    <button type="button" className={buttonStyles.icon} aria-label={`Editar rol ${role.name}`} title="Editar" onClick={() => onEdit(role)}><Pencil size={16} /></button>
                    <button type="button" className={`${buttonStyles.icon} hover:bg-rose-50 hover:text-rose-600`} aria-label={`Eliminar rol ${role.name}`} title={assigned ? "No se puede eliminar un rol asignado" : "Eliminar"} disabled={Boolean(assigned)} onClick={() => onDelete(role)}><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <ul className="mt-4 flex flex-1 flex-wrap content-start gap-1.5">
                {role.permissions.length === 0 && <li className="text-sm text-slate-400">Sin permisos</li>}
                {role.permissions.map((permission) => (
                  <li key={permission} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{labels.get(permission) ?? permission}</li>
                ))}
              </ul>
              {assigned !== undefined && (
                <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">
                  {assigned === 1 ? "1 usuario asignado" : `${assigned} usuarios asignados`}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
