import { useState } from "react";
import { Plus } from "lucide-react";
import type { Role, User } from "../types";
import { UserFilters, type UserFilterValues } from "./UserFilters";
import { UserRow } from "./UserRow";
import { UserStats } from "./UserStats";
import { PageHeader, buttonStyles } from "./ui";

interface UsersViewProps {
  users: User[];
  roles: Role[];
  currentUserId: string;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const noFilters: UserFilterValues = { query: "", roleId: "all", status: "all" };

export function UsersView({ users, roles, currentUserId, canWrite, onAdd, onEdit, onDelete }: UsersViewProps) {
  const [filters, setFilters] = useState(noFilters);

  const rolesById = new Map(roles.map((role) => [role.id, role]));
  const normalizedQuery = filters.query.trim().toLowerCase();
  const filtered = users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery)
    && (filters.roleId === "all" || user.role_id === filters.roleId)
    && (filters.status === "all" || user.status === filters.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestiona quién puede acceder al panel y con qué rol."
        action={canWrite && <button type="button" className={buttonStyles.primary} onClick={onAdd}><Plus size={16} /> Añadir usuario</button>}
      />

      <UserStats users={users} />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <UserFilters values={filters} roles={roles} onChange={setFilters} />

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
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  role={rolesById.get(user.role_id)}
                  isSelf={user.id === currentUserId}
                  canWrite={canWrite}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
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
