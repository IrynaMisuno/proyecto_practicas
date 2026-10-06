import { useCallback, useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { errorMessage } from "../errors";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { useRoles } from "../hooks/useRoles";
import { useToast } from "../hooks/useToast";
import { useUsers } from "../hooks/useUsers";
import type { CurrentUser, NewUserDraft, Role, RoleDraft, User, UserDraft } from "../types";
import { RoleDialog } from "./RoleDialog";
import { RolesView } from "./RolesView";
import { Sidebar, type Section, type SidebarSection } from "./Sidebar";
import { UserDialog } from "./UserDialog";
import { UsersView } from "./UsersView";
import { ConfirmDialog, FormError, Toast, buttonStyles } from "./ui";

type DialogState =
  | { kind: "user"; user?: User }
  | { kind: "role"; role?: Role }
  | { kind: "delete-user"; user: User }
  | { kind: "delete-role"; role: Role }
  | null;

/** Panel con sesión: navegación, vistas de usuarios y roles, y sus diálogos. */
export function Dashboard({ currentUser }: { currentUser: CurrentUser }) {
  const { can, logout, refresh } = useAuth();
  const canReadUsers = can("users:read");
  const canReadRoles = can("roles:read");
  const sections: SidebarSection[] = [
    ...(canReadUsers ? [{ id: "users" as const, label: "Usuarios", icon: Users }] : []),
    ...(canReadRoles ? [{ id: "roles" as const, label: "Roles", icon: ShieldCheck }] : []),
  ];

  const [section, setSection] = useState<Section>(canReadUsers ? "users" : "roles");
  const activeSection = sections.some((item) => item.id === section) ? section : sections[0]?.id;

  const { users, error: usersError, reload: reloadUsers, createUser, updateUser, deleteUser, resendInvitation } = useUsers(canReadUsers);
  const { roles, error: rolesError, reload: reloadRoles, createRole, updateRole, deleteRole } = useRoles();
  const { permissions, error: permissionsError, reload: reloadPermissions } = usePermissions();
  const { message: notice, announce } = useToast();
  const [dialog, setDialog] = useState<DialogState>(null);

  const loadError = usersError || rolesError || permissionsError;
  const closeDialog = useCallback(() => setDialog(null), []);

  // Al cambiar `viewVersion`, la vista se monta de nuevo y vuelve a su estado inicial (sin filtros).
  const [viewVersion, setViewVersion] = useState(0);

  function reloadData() {
    void reloadUsers();
    void reloadRoles();
    void reloadPermissions();
  }

  /** Pulsar una sección, aunque ya sea la activa, la recarga desde cero: datos nuevos y sin filtros. */
  function openSection(next: Section) {
    setSection(next);
    setViewVersion((version) => version + 1);
    reloadData();
  }

  async function saveUser(draft: NewUserDraft | UserDraft, existing?: User) {
    if (existing) {
      await updateUser(existing.id, draft);
      // Si me cambio a mí mismo el rol, mis permisos cambian.
      if (existing.id === currentUser.id) await refresh();
      announce("Usuario actualizado.");
    } else {
      await createUser(draft);
      announce(`Invitación enviada a ${draft.email}.`);
    }
    setDialog(null);
  }

  async function resend(user: User) {
    try {
      await resendInvitation(user.id);
      announce(`Invitación reenviada a ${user.name}.`);
    } catch (caught) {
      announce(errorMessage(caught, "No se pudo reenviar la invitación."));
    }
  }

  async function saveRole(draft: RoleDraft, existing?: Role) {
    if (existing) {
      await updateRole(existing.id, draft);
      if (existing.id === currentUser.role_id) await refresh();
      announce("Rol actualizado.");
    } else {
      await createRole(draft);
      announce("Rol creado.");
    }
    setDialog(null);
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar sections={sections} activeSection={activeSection} currentUser={currentUser} onSelect={openSection} onLogout={() => void logout()} />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:ml-64 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-6">
          {loadError && (
            <div className="flex items-center justify-between gap-4">
              <FormError message={loadError} />
              <button type="button" className={buttonStyles.secondary} onClick={reloadData}>Reintentar</button>
            </div>
          )}
          {!activeSection && <p className="text-sm text-slate-500">Tu rol no tiene permisos para ver ninguna sección. Contacta con un administrador.</p>}
          {activeSection === "users" && users && (
            <UsersView
              key={viewVersion}
              users={users}
              roles={roles}
              currentUserId={currentUser.id}
              canWrite={can("users:write")}
              onAdd={() => setDialog({ kind: "user" })}
              onEdit={(user) => setDialog({ kind: "user", user })}
              onDelete={(user) => setDialog({ kind: "delete-user", user })}
              onResendInvitation={(user) => void resend(user)}
            />
          )}
          {activeSection === "roles" && (
            <RolesView
              key={viewVersion}
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
            await deleteUser(dialog.user.id);
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
            await deleteRole(dialog.role.id);
            announce("Rol eliminado.");
          }}
        />
      )}
      <Toast message={notice} />
    </div>
  );
}
