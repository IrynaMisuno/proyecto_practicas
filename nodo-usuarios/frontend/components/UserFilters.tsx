import { useRef } from "react";
import { Search } from "lucide-react";
import { statusLabels } from "../format";
import type { Role, UserStatus } from "../types";
import { FilterChip, inputStyles } from "./ui";

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

/** Búsqueda por nombre o email, filtros por rol y estado, y los filtros aplicados para quitarlos uno a uno. */
export function UserFilters({ values, roles, onChange }: UserFiltersProps) {
  const queryRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  const query = values.query.trim();
  const roleName = roles.find((role) => role.id === values.roleId)?.name ?? "desconocido";
  const applied = [
    ...(query ? [{ key: "query", label: `Búsqueda: «${query}»`, reset: { query: "" }, field: queryRef }] : []),
    ...(values.roleId !== "all" ? [{ key: "role", label: `Rol: ${roleName}`, reset: { roleId: "all" }, field: roleRef }] : []),
    ...(values.status !== "all" ? [{ key: "status", label: `Estado: ${statusLabels[values.status]}`, reset: { status: "all" as const }, field: statusRef }] : []),
  ];

  return (
    <div className="space-y-3 border-b border-slate-200 p-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar usuarios</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input ref={queryRef} className={`${inputStyles} pl-9`} value={values.query} onChange={(event) => onChange({ ...values, query: event.target.value })} placeholder="Buscar por nombre o email" />
        </label>
        <div className="grid grid-cols-2 gap-3 md:w-96">
          <label><span className="sr-only">Filtrar por rol</span>
            <select ref={roleRef} className={inputStyles} value={values.roleId} onChange={(event) => onChange({ ...values, roleId: event.target.value })}>
              <option value="all">Todos los roles</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </label>
          <label><span className="sr-only">Filtrar por estado</span>
            <select ref={statusRef} className={inputStyles} value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value as UserFilterValues["status"] })}>
              <option value="all">Todos los estados</option>
              {(Object.keys(statusLabels) as UserStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
        </div>
      </div>
      {applied.length > 0 && (
        <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-2">
          {applied.map((filter) => (
            <li key={filter.key}>
              <FilterChip
                label={filter.label}
                onRemove={() => {
                  onChange({ ...values, ...filter.reset });
                  // La cruz desaparece al quitar el filtro: el foco pasa a su campo para no perderse (WCAG 2.4.3).
                  filter.field.current?.focus();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
