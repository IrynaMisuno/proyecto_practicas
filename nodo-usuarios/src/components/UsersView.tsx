import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Role, User, UserStatus } from "../types";
import { RoleBadge, StatusBadge, buttonStyles, formatDate, getInitials, inputStyles, statusLabels } from "./ui";

interface UsersViewProps {
  users: User[];
  roles: Role[];
  currentUserId: string;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersView({ users, roles, currentUserId, canWrite, onAdd, onEdit, onDelete }: UsersViewProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");

  const rolesById = new Map(roles.map((role) => [role.id, role]));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery)
    && (roleFilter === "all" || user.role_id === roleFilter)
    && (statusFilter === "all" || user.status === statusFilter));

  const stats = [
    { label: "Usuarios", value: users.length },
    { label: "Activos", value: users.filter((user) => user.status === "active").length },
    { label: "Invitados", value: users.filter((user) => user.status === "invited").length },
    { label: "Suspendidos", value: users.filter((user) => user.status === "suspended").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona quién puede acceder al panel y con qué rol.</p>
        </div>
        {canWrite && <button type="button" className={buttonStyles.primary} onClick={onAdd}><Plus size={16} /> Añadir usuario</button>}
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <dt className="text-sm text-slate-500">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar usuarios</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputStyles} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o email" />
          </label>
          <div className="grid grid-cols-2 gap-3 md:w-96">
            <label><span className="sr-only">Filtrar por rol</span>
              <select className={inputStyles} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">Todos los roles</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </label>
            <label><span className="sr-only">Filtrar por estado</span>
              <select className={inputStyles} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus)}>
                <option value="all">Todos los estados</option>
                {(Object.keys(statusLabels) as UserStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Usuario</th>
                <th scope="col" className="px-4 py-3">Rol</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="hidden px-4 py-3 md:table-cell">Actualizado</th>
                {canWrite && <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => {
                const role = rolesById.get(user.role_id);
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">{getInitials(user.name)}</span>
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
                          <button type="button" className={buttonStyles.icon} title="Editar" aria-label={`Editar a ${user.name}`} onClick={() => onEdit(user)}><Pencil size={16} /></button>
                          <button type="button" className={`${buttonStyles.icon} hover:bg-rose-50 hover:text-rose-600`} title={isSelf ? "No puedes eliminar tu propia cuenta" : "Eliminar"} aria-label={`Eliminar a ${user.name}`} disabled={isSelf} onClick={() => onDelete(user)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="font-medium text-slate-900">No hay usuarios que coincidan</p>
              <p className="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o cambia los filtros.</p>
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">Mostrando {filtered.length} de {users.length}</div>
      </div>
    </div>
  );
}
