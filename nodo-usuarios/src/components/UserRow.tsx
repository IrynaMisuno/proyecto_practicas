import { Pencil, Send, Trash2 } from "lucide-react";
import { formatDate } from "../format";
import type { Role, User } from "../types";
import { Avatar, IconButton, RoleBadge, StatusBadge } from "./ui";

interface UserRowProps {
  user: User;
  role?: Role;
  isSelf: boolean;
  canWrite: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResendInvitation: (user: User) => void;
}

/** Fila de la tabla de usuarios. */
export function UserRow({ user, role, isSelf, canWrite, onEdit, onDelete, onResendInvitation }: UserRowProps) {
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{user.name}{isSelf && <span className="ml-2 text-xs font-normal text-slate-400">(tú)</span>}</p>
            <p className="truncate text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">{role ? <RoleBadge name={role.name} tone={role.tone} /> : <span className="text-slate-400">Sin rol</span>}</td>
      <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
      <td className="hidden whitespace-nowrap px-4 py-3 text-slate-500 md:table-cell">{formatDate(user.updated_at)}</td>
      {canWrite && (
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            {user.status === "invited" && (
              <IconButton label={`Reenviar invitación a ${user.name}`} title="Reenviar invitación" icon={<Send size={16} />} onClick={() => onResendInvitation(user)} />
            )}
            <IconButton label={`Editar a ${user.name}`} title="Editar" icon={<Pencil size={16} />} onClick={() => onEdit(user)} />
            <IconButton tone="danger" label={`Eliminar a ${user.name}`} title={isSelf ? "No puedes eliminar tu propia cuenta" : "Eliminar"} icon={<Trash2 size={16} />} disabled={isSelf} onClick={() => onDelete(user)} />
          </div>
        </td>
      )}
    </tr>
  );
}
