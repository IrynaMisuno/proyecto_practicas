import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  Ellipsis,
  KeyRound,
  LayoutDashboard,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { AccessDialog } from "./components/AccessDialog";
import { RoleDialog } from "./components/RoleDialog";
import { UserDialog } from "./components/UserDialog";
import { createRole, createUser, deleteRole, deleteUser, loadRoles, loadUsers, updateRole, updateUser } from "./data";
import type { Role, RoleDraft, User, UserDraft, UserStatus } from "./types";

type Section = "users" | "roles";
type StatusFilter = "all" | UserStatus;

const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
};

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [apiState, setApiState] = useState<"loading" | "connected" | "offline">("loading");
  const [section, setSection] = useState<Section>("users");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortAscending, setSortAscending] = useState(true);
  const [userDialog, setUserDialog] = useState<User | null | false>(false);
  const [roleDialog, setRoleDialog] = useState<Role | null | false>(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [notice, setNotice] = useState("");

  async function refreshData() {
    setApiState("loading");
    try {
      const [loadedUsers, loadedRoles] = await Promise.all([loadUsers(), loadRoles()]);
      setUsers(loadedUsers);
      setRoles(loadedRoles);
      setApiState("connected");
    } catch {
      setApiState("offline");
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  const activeCount = users.filter((user) => user.status === "active").length;
  const invitedCount = users.filter((user) => user.status === "invited").length;
  const filteredUsers = users
    .filter((user) => {
      const searchText = `${user.name} ${user.email} ${user.username} ${user.department}`.toLowerCase();
      return searchText.includes(query.trim().toLowerCase())
        && (statusFilter === "all" || user.status === statusFilter)
        && (roleFilter === "all" || user.roleId === roleFilter);
    })
    .sort((first, second) => first.name.localeCompare(second.name, "es") * (sortAscending ? 1 : -1));

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function saveUser(draft: UserDraft, userId?: string, password?: string) {
    const duplicateEmail = users.some((user) => user.email.toLowerCase() === draft.email.toLowerCase() && user.id !== userId);
    const duplicateUsername = users.some((user) => user.username.toLowerCase() === draft.username.toLowerCase() && user.id !== userId);
    if (duplicateEmail || duplicateUsername) {
      announce(duplicateEmail ? "Ese correo ya pertenece a otro usuario." : "Ese nombre de usuario ya está en uso.");
      return;
    }
    try {
      if (userId) {
        const updated = await updateUser(userId, draft);
        setUsers((current) => current.map((user) => user.id === userId ? updated : user));
        announce("Cambios del usuario guardados.");
      } else {
        const created = await createUser(draft, password ?? "");
        setUsers((current) => [{ ...created, updatedAt: created.updatedAt || new Date().toISOString() }, ...current]);
        announce("Usuario creado correctamente.");
      }
      setUserDialog(false);
    } catch (error) {
      announce(getErrorMessage(error));
    }
  }

  async function removeUser(user: User) {
    if (!window.confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      announce("Usuario eliminado.");
    } catch (error) {
      announce(getErrorMessage(error));
    }
  }

  async function saveRole(draft: RoleDraft, roleId?: string) {
    const duplicateName = roles.some((role) => role.name.toLowerCase() === draft.name.toLowerCase() && role.id !== roleId);
    if (duplicateName) {
      announce("Ya existe un rol con ese nombre.");
      return;
    }
    try {
      if (roleId) {
        const updated = await updateRole(roleId, draft);
        setRoles((current) => current.map((role) => role.id === roleId ? updated : role));
        announce("Cambios del rol guardados.");
      } else {
        const created = await createRole(draft);
        setRoles((current) => [...current, created]);
        announce("Rol creado correctamente.");
      }
      setRoleDialog(false);
    } catch (error) {
      announce(getErrorMessage(error));
    }
  }

  async function removeRole(role: Role) {
    const assignedCount = users.filter((user) => user.roleId === role.id).length;
    if (assignedCount > 0 || roles.length <= 1) return;
    if (!window.confirm(`¿Eliminar el rol «${role.name}»?`)) return;
    try {
      await deleteRole(role.id);
      setRoles((current) => current.filter((item) => item.id !== role.id));
      if (roleFilter === role.id) setRoleFilter("all");
      announce("Rol eliminado.");
    } catch (error) {
      announce(getErrorMessage(error));
    }
  }

  const currentTitle = section === "users" ? "Usuarios" : "Roles y permisos";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Nodo, inicio">
          <span className="brand-mark"><span /></span><span className="brand-name">nodo<span>.</span></span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-avatar">N</span><span className="workspace-meta"><strong>Northstar Studio</strong><small>Espacio de trabajo</small></span><ChevronDown size={15} />
        </div>
        <nav className="side-nav" aria-label="Navegación principal">
          <span className="nav-caption">GESTIÓN</span>
          <button className="side-link" type="button"><LayoutDashboard size={17} /><span>Resumen</span></button>
          <button className={`side-link ${section === "users" ? "is-current" : ""}`} type="button" onClick={() => setSection("users")}><Users size={17} /><span>Usuarios</span><span className="nav-count">{users.length}</span></button>
          <button className={`side-link ${section === "roles" ? "is-current" : ""}`} type="button" onClick={() => setSection("roles")}><ShieldCheck size={17} /><span>Roles y permisos</span></button>
          <span className="nav-caption nav-caption-lower">SISTEMA</span>
          <button className="side-link" type="button" onClick={() => setAccessOpen(true)}><KeyRound size={17} /><span>Verificar acceso</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><CircleHelp size={17} /><span>Centro de ayuda</span></div>
          <div className="account-chip"><span className="account-avatar">LF</span><span className="account-meta"><strong>Lucía Fernández</strong><small>Administradora</small></span><Ellipsis size={17} /></div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs"><span>Administración</span><span className="crumb-divider">/</span><strong>{currentTitle}</strong></div>
          <div className="topbar-actions"><span className="environment-label"><span className={`environment-dot ${apiState === "offline" ? "is-offline" : ""}`} />{apiState === "loading" ? "Conectando API" : apiState === "connected" ? "API local conectada" : "API local desconectada"}</span><button className="button button-outline access-button" type="button" onClick={() => setAccessOpen(true)}><KeyRound size={15} /> Verificar acceso</button></div>
        </header>

        <main className="page-content">
          <section className="welcome-row">
            <div><span className="eyebrow">CONTROL DE IDENTIDAD <span className="eyebrow-line" /></span><h1>{currentTitle}</h1><p className="page-subtitle">Administra quién puede acceder y qué puede hacer en tu espacio.</p></div>
            <div className="welcome-actions">{section === "users" ? <button className="button button-primary" type="button" disabled={apiState !== "connected"} onClick={() => setUserDialog(null)}><Plus size={17} /> Añadir usuario</button> : <button className="button button-primary" type="button" disabled={apiState !== "connected"} onClick={() => setRoleDialog(null)}><Plus size={17} /> Crear rol</button>}</div>
          </section>

          {apiState !== "connected" && <div className={`api-banner ${apiState === "offline" ? "is-offline" : ""}`} role={apiState === "offline" ? "alert" : "status"}>
            <span>{apiState === "loading" ? "Cargando usuarios y roles desde la API local…" : "No hay conexión con el mock. Inicia npm run api:mock para habilitar las operaciones."}</span>
            {apiState === "offline" && <button className="button button-quiet" type="button" onClick={() => void refreshData()}>Reintentar</button>}
          </div>}

          <section className="metrics" aria-label="Resumen de usuarios">
            <div className="metric metric-total"><span className="metric-label">Usuarios registrados</span><strong>{users.length.toString().padStart(2, "0")}</strong><span className="metric-foot"><Users size={14} /> En este espacio</span></div>
            <div className="metric"><span className="metric-label">Cuentas activas</span><strong>{activeCount.toString().padStart(2, "0")}</strong><span className="metric-foot"><span className="tiny-status is-active" /> {users.length ? Math.round(activeCount / users.length * 100) : 0}% del equipo</span></div>
            <div className="metric"><span className="metric-label">Invitaciones pendientes</span><strong>{invitedCount.toString().padStart(2, "0")}</strong><span className="metric-foot"><UserRoundPlus size={14} /> Esperando activación</span></div>
            <div className="metric metric-roles"><span className="metric-label">Roles configurados</span><strong>{roles.length.toString().padStart(2, "0")}</strong><button type="button" className="metric-link" onClick={() => setSection("roles")}>Revisar permisos <span aria-hidden="true">↗</span></button></div>
          </section>

          <section className="directory-section">
            <div className="section-heading">
              <div className="section-tabs" role="tablist" aria-label="Administrar usuarios o roles">
                <button className={`section-tab ${section === "users" ? "is-selected" : ""}`} type="button" role="tab" aria-selected={section === "users"} onClick={() => setSection("users")}>Directorio <span>{users.length}</span></button>
                <button className={`section-tab ${section === "roles" ? "is-selected" : ""}`} type="button" role="tab" aria-selected={section === "roles"} onClick={() => setSection("roles")}>Roles <span>{roles.length}</span></button>
              </div>
              <span className="updated-caption"><BadgeCheck size={14} /> {apiState === "connected" ? "Sincronizado con la API local" : "Conexión pendiente"}</span>
            </div>

            {section === "users" ? <>
              <div className="toolbar">
                <label className="search-field"><Search size={17} /><input aria-label="Buscar usuarios" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, correo o equipo" /></label>
                <div className="filter-group">
                  <label className="select-filter"><span className="sr-only">Filtrar por rol</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Todos los roles</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><ChevronDown size={14} /></label>
                  <label className="select-filter"><span className="sr-only">Filtrar por estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">Todos los estados</option><option value="active">Activo</option><option value="invited">Invitado</option><option value="suspended">Suspendido</option></select><ChevronDown size={14} /></label>
                  <button className="icon-button sort-button" type="button" title="Ordenar por nombre" aria-label={`Ordenar por nombre ${sortAscending ? "descendente" : "ascendente"}`} onClick={() => setSortAscending((current) => !current)}><ArrowDownUp size={16} /></button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="user-table">
                  <thead><tr><th><span>PERSONA</span></th><th><span>ROL ASIGNADO</span></th><th><span>EQUIPO</span></th><th><span>ESTADO</span></th><th><span>ÚLTIMA ACTIVIDAD</span></th><th><span className="sr-only">Acciones</span></th></tr></thead>
                  <tbody>{filteredUsers.map((user) => {
                    const role = roles.find((item) => item.id === user.roleId);
                    return <tr key={user.id}>
                      <td><div className="person-cell"><span className={`person-avatar avatar-${user.id.slice(-1)}`}>{getInitials(user.name)}</span><span className="person-details"><strong>{user.name}</strong><small>{user.email}</small></span></div></td>
                      <td><span className={`role-pill tone-${role?.tone ?? "ink"}`}><span className="role-dot" />{role?.name ?? "Sin rol"}</span></td>
                      <td className="department-cell">{user.department}</td>
                      <td><span className={`status-pill status-${user.status}`}><span />{statusLabels[user.status]}</span></td>
                      <td className="date-cell">{formatDate(user.updatedAt)}</td>
                      <td><div className="row-actions"><button className="icon-button" type="button" title="Editar usuario" aria-label={`Editar ${user.name}`} disabled={apiState !== "connected"} onClick={() => setUserDialog(user)}><Pencil size={15} /></button><button className="icon-button danger-action" type="button" title="Eliminar usuario" aria-label={`Eliminar ${user.name}`} disabled={apiState !== "connected"} onClick={() => void removeUser(user)}><Trash2 size={15} /></button></div></td>
                    </tr>;
                  })}</tbody>
                </table>
                {filteredUsers.length === 0 && <div className="empty-state"><Search size={22} /><strong>No encontramos usuarios</strong><span>Ajusta la búsqueda o los filtros para ver resultados.</span></div>}
              </div>
              <div className="table-footer"><span>Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios</span><span className="table-foot-note">Actualizado en tiempo real <span className="tiny-status is-active" /></span></div>
            </> : <div className="roles-area">
              <div className="roles-intro"><div><h2>Permisos del espacio</h2><p>Define el alcance de cada perfil y asigna roles desde el directorio.</p></div><span className="roles-intro-mark"><ShieldCheck size={23} /></span></div>
              <div className="role-list">{roles.map((role) => {
                const assignedCount = users.filter((user) => user.roleId === role.id).length;
                const deleteDisabled = apiState !== "connected" || assignedCount > 0 || roles.length <= 1;
                return <article className="role-row" key={role.id}>
                  <span className={`role-emblem tone-${role.tone}`}><ShieldCheck size={18} /></span>
                  <div className="role-info"><div className="role-name-line"><h3>{role.name}</h3><span className="role-permission-label">Rol de acceso</span></div><p>{role.description}</p></div>
                  <div className="role-assignment"><strong>{assignedCount.toString().padStart(2, "0")}</strong><span>{assignedCount === 1 ? "usuario asignado" : "usuarios asignados"}</span></div>
                  <div className="role-actions"><button className="icon-button" type="button" title="Editar rol" aria-label={`Editar rol ${role.name}`} disabled={apiState !== "connected"} onClick={() => setRoleDialog(role)}><Pencil size={15} /></button><button className="icon-button danger-action" type="button" title={deleteDisabled ? assignedCount ? "No se puede borrar un rol asignado" : roles.length <= 1 ? "Debe existir al menos un rol" : "API local no conectada" : "Eliminar rol"} aria-label={`Eliminar rol ${role.name}`} disabled={deleteDisabled} onClick={() => void removeRole(role)}><Trash2 size={15} /></button></div>
                </article>;
              })}{roles.length === 0 && <div className="empty-state role-empty"><ShieldCheck size={22} /><strong>Aún no hay roles</strong><span>Crea un rol para poder asignarlo a los usuarios.</span><button className="button button-primary" type="button" onClick={() => setRoleDialog(null)}><Plus size={16} /> Crear primer rol</button></div>}</div>
              <div className="permission-note"><KeyRound size={16} /><p><strong>Principio de mínimo acceso.</strong> Asigna solo los permisos necesarios para cada función.</p><button type="button" aria-label="Más información sobre permisos" title="Los permisos efectivos deben validarse también en el servidor"><CircleHelp size={16} /></button></div>
            </div>}
          </section>
          <footer className="page-footer"><span>NODO <span>·</span> CONTROL DE ACCESO</span><span>Modo demostración <span className="tiny-status is-demo" /></span></footer>
        </main>
      </div>

      <UserDialog open={userDialog !== false} user={userDialog || undefined} roles={roles} onClose={() => setUserDialog(false)} onSave={saveUser} />
      <RoleDialog open={roleDialog !== false} role={roleDialog || undefined} onClose={() => setRoleDialog(false)} onSave={saveRole} />
      <AccessDialog open={accessOpen} onClose={() => setAccessOpen(false)} />
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}
