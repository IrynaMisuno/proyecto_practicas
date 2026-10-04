import { Search } from "lucide-react";
import { statusLabels } from "../format";
import type { Role, UserStatus } from "../types";
import { inputStyles } from "./ui";

export interface UserFilterValues {
  query: string;
  roleId: string;
  status: "all" | UserStatus;
}

interface UserFiltersProps {
  values: UserFilterValues;
  roles: Role[];
  onChange: (values: UserFilterValues) => void;
}

/** Búsqueda por nombre o email y filtros por rol y estado. */
export function UserFilters({ values, roles, onChange }: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Buscar usuarios</span>
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputStyles} pl-9`} value={values.query} onChange={(event) => onChange({ ...values, query: event.target.value })} placeholder="Buscar por nombre o email" />
      </label>
      <div className="grid grid-cols-2 gap-3 md:w-96">
        <label><span className="sr-only">Filtrar por rol</span>
          <select className={inputStyles} value={values.roleId} onChange={(event) => onChange({ ...values, roleId: event.target.value })}>
            <option value="all">Todos los roles</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </label>
        <label><span className="sr-only">Filtrar por estado</span>
          <select className={inputStyles} value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value as UserFilterValues["status"] })}>
            <option value="all">Todos los estados</option>
            {(Object.keys(statusLabels) as UserStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
