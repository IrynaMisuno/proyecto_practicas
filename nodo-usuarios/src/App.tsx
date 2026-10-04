import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, LogOut, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "./auth";
import * as api from "./data";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { LoginPage } from "./components/LoginPage";
import { ForgotPasswordPage, ResetPasswordPage } from "./components/PasswordRecovery";
import { RoleDialog } from "./components/RoleDialog";
import { RolesView } from "./components/RolesView";
import { UserDialog } from "./components/UserDialog";
import { UsersView } from "./components/UsersView";
import { FormError, Toast, buttonStyles, getInitials } from "./components/ui";
import type { CurrentUser, PermissionInfo, Role, RoleDraft, User, UserDraft } from "./types";

type Section = "users" | "roles";
type PublicPage = { name: "login"; notice?: string } | { name: "forgot" } | { name: "reset"; token: string };

const RESET_PATH = "/restablecer-contrasena";

function initialPublicPage(): PublicPage {
  if (window.location.pathname !== RESET_PATH) return { name: "login" };
  // El token llega en el fragmento (#token=...). Se guarda en memoria y se quita de la barra
  // de direcciones para que no quede en el historial.
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
  window.history.replaceState(null, "", RESET_PATH);
  return { name: "reset", token };
}

function goTo(path: string) {
  if (window.location.pathname !== path) window.history.replaceState(null, "", path);
}

type DialogState =
  | { kind: "user"; user?: User }
  | { kind: "role"; role?: Role }
  | { kind: "delete-user"; user: User }
  | { kind: "delete-role"; role: Role }
  | null;

export default function App() {
  const { user, loading, logout, sessionExpired } = useAuth();
  const [page, setPage] = useState<PublicPage>(initialPublicPage);

  const showLogin = useCallback((notice?: string) => {
    goTo("/");
    setPage({ name: "login", notice });
  }, []);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-400"><LoaderCircle className="animate-spin" aria-label="Cargando" /></div>;
  }
  // Un enlace de recuperación se atiende aunque haya una sesión abierta en este navegador.
  if (page.name === "reset") {
    return (
      <ResetPasswordPage
        token={page.token}
        onBack={() => showLogin()}
        onDone={(message) => {
          void logout();
          showLogin(message);
        }}
      />
    );
  }
  if (user) return <Dashboard currentUser={user} />;
  if (page.name === "forgot") return <ForgotPasswordPage onBack={() => showLogin()} />;
  const notice = page.notice ?? (sessionExpired ? "Tu sesión ha caducado. Vuelve a iniciar sesión; los últimos cambios no se han guardado." : undefined);
  return <LoginPage notice={notice} noticeTone={page.notice ? "success" : "warning"} onForgotPassword={() => setPage({ name: "forgot" })} />;
}

function Dashboard({ currentUser }: { currentUser: CurrentUser }) {
  const { can, logout, refresh } = useAuth();
  const canReadUsers = can("users:read");
  const canReadRoles = can("roles:read");
  const sections = [
    ...(canReadUsers ? [{ id: "users" as const, label: "Usuarios", icon: Users }] : []),
    ...(canReadRoles ? [{ id: "roles" as const, label: "Roles", icon: ShieldCheck }] : []),
  ];

  const [section, setSection] = useState<Section>(canReadUsers ? "users" : "roles");
  const [users, setUsers] = useState<User[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [loadError, setLoadError] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);

  const activeSection = sections.some((item) => item.id === section) ? section : sections[0]?.id;

  const loadData = useCallback(async () => {
    setLoadError("");
    try {
      const [loadedUsers, loadedRoles, loadedPermissions] = await Promise.all([
        canReadUsers ? api.loadUsers() : Promise.resolve(null),
        api.loadRoles(),
        api.loadPermissions(),
      ]);
      setUsers(loadedUsers);
      setRoles(loadedRoles);
      setPermissions(loadedPermissions);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los datos.");
    }
  }, [canReadUsers]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function announce(message: string) {
    window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3500);
  }

  const closeDialog = useCallback(() => setDialog(null), []);

  async function saveUser(draft: UserDraft, existing?: User) {
    if (existing) {
      const updated = await api.updateUser(existing.id, draft);
      setUsers((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? null);
      // Si me cambio a mí mismo el rol, mis permisos cambian.
      if (existing.id === currentUser.id) await refresh();
      announce("Usuario actualizado.");
    } else {
      const created = await api.createUser(draft);
      setUsers((current) => [...(current ?? []), created].sort((a, b) => a.name.localeCompare(b.name, "es")));
      announce("Usuario creado.");
    }
    setDialog(null);
  }

  async function saveRole(draft: RoleDraft, existing?: Role) {
    if (existing) {
      const updated = await api.updateRole(existing.id, draft);
      setRoles((current) => current.map((item) => item.id === updated.id ? updated : item));
      if (existing.id === currentUser.role_id) await refresh();
      announce("Rol actualizado.");
    } else {
      const created = await api.createRole(draft);
      setRoles((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "es")));
      announce("Rol creado.");
    }
    setDialog(null);
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6 lg:py-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">N</span>
            <span className="text-lg font-semibold tracking-tight">Nodo</span>
          </div>
          <button type="button" className={`${buttonStyles.icon} lg:hidden`} aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => void logout()}><LogOut size={18} /></button>
        </div>
        <nav aria-label="Secciones" className="flex gap-1 px-4 pb-3 lg:flex-1 lg:flex-col lg:px-3 lg:pb-0">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeSection === item.id ? "page" : undefined}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeSection === item.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-slate-200 p-4 lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">{getInitials(currentUser.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{currentUser.name}</p>
              <p className="truncate text-xs text-slate-500">{currentUser.role_name}</p>
            </div>
            <button type="button" className={buttonStyles.icon} aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => void logout()}><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:ml-64 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-6">
          {loadError && (
            <div className="flex items-center justify-between gap-4">
              <FormError message={loadError} />
              <button type="button" className={buttonStyles.secondary} onClick={() => void loadData()}>Reintentar</button>
            </div>
          )}
          {!activeSection && <p className="text-sm text-slate-500">Tu rol no tiene permisos para ver ninguna sección. Contacta con un administrador.</p>}
          {activeSection === "users" && users && (
            <UsersView
              users={users}
              roles={roles}
              currentUserId={currentUser.id}
              canWrite={can("users:write")}
              onAdd={() => setDialog({ kind: "user" })}
              onEdit={(user) => setDialog({ kind: "user", user })}
              onDelete={(user) => setDialog({ kind: "delete-user", user })}
            />
          )}
          {activeSection === "roles" && (
            <RolesView
              roles={roles}
              users={users}
              permissions={permissions}
              canWrite={can("roles:write")}
              onAdd={() => setDialog({ kind: "role" })}
              onEdit={(role) => setDialog({ kind: "role", role })}
              onDelete={(role) => setDialog({ kind: "delete-role", role })}
            />
          )}
        </div>
      </main>

      {dialog?.kind === "user" && (
        <UserDialog user={dialog.user} roles={roles} isSelf={dialog.user?.id === currentUser.id} onClose={closeDialog} onSubmit={(draft) => saveUser(draft, dialog.user)} />
      )}
      {dialog?.kind === "role" && (
        <RoleDialog role={dialog.role} permissions={permissions} onClose={closeDialog} onSubmit={(draft) => saveRole(draft, dialog.role)} />
      )}
      {dialog?.kind === "delete-user" && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`Se eliminará la cuenta de ${dialog.user.name} (${dialog.user.email}). Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar usuario"
          onClose={closeDialog}
          onConfirm={async () => {
            await api.deleteUser(dialog.user.id);
            setUsers((current) => current?.filter((item) => item.id !== dialog.user.id) ?? null);
            announce("Usuario eliminado.");
          }}
        />
      )}
      {dialog?.kind === "delete-role" && (
        <ConfirmDialog
          title="Eliminar rol"
          message={`Se eliminará el rol «${dialog.role.name}». Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar rol"
          onClose={closeDialog}
          onConfirm={async () => {
            await api.deleteRole(dialog.role.id);
            setRoles((current) => current.filter((item) => item.id !== dialog.role.id));
            announce("Rol eliminado.");
          }}
        />
      )}
      <Toast message={notice} />
    </div>
  );
}
