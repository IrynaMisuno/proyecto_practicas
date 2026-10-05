import { Pencil, ShieldCheck, Trash2 } from "lucide-react";
import type { Permission, Role } from "../types";
import { IconButton, toneStyles } from "./ui";

interface RoleCardProps {
  role: Role;
  permissionLabels: Map<Permission, string>;
  /** Usuarios con este rol; undefined si no se pueden ver los usuarios. */
  assigned?: number;
  canWrite: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

/** Tarjeta de un rol con sus permisos y los usuarios que lo tienen. */
export function RoleCard({ role, permissionLabels, assigned, canWrite, onEdit, onDelete }: RoleCardProps) {
  return (
    <li className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${toneStyles[role.tone].icon}`}><ShieldCheck size={18} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900">{role.name}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{role.description || "Sin descripción"}</p>
        </div>
        {canWrite && (
          <div className="flex gap-1">
            <IconButton label={`Editar rol ${role.name}`} title="Editar" icon={<Pencil size={16} />} onClick={() => onEdit(role)} />
            <IconButton tone="danger" label={`Eliminar rol ${role.name}`} title={assigned ? "No se puede eliminar un rol asignado" : "Eliminar"} icon={<Trash2 size={16} />} disabled={Boolean(assigned)} onClick={() => onDelete(role)} />
          </div>
        )}
      </div>
      <ul className="mt-4 flex flex-1 flex-wrap content-start gap-1.5">
        {role.permissions.length === 0 && <li className="text-sm text-slate-400">Sin permisos</li>}
        {role.permissions.map((permission) => (
          <li key={permission} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{permissionLabels.get(permission) ?? permission}</li>
        ))}
      </ul>
      {assigned !== undefined && (
        <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">
          {assigned === 1 ? "1 usuario asignado" : `${assigned} usuarios asignados`}
        </p>
      )}
    </li>
  );
}
