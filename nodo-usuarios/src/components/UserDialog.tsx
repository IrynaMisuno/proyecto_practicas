import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { Role, User, UserDraft, UserStatus } from "../types";

interface UserDialogProps {
  open: boolean;
  user?: User;
  roles: Role[];
  onClose: () => void;
  onSave: (draft: UserDraft, userId?: string, password?: string) => void;
}

const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
};

export function UserDialog({ open, user, roles, onClose, onSave }: UserDialogProps) {
  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSave(
      {
        name: String(formData.get("name")).trim(),
        email: String(formData.get("email")).trim(),
        username: String(formData.get("username")).trim(),
        department: String(formData.get("department")).trim(),
        roleId: String(formData.get("roleId")),
        status: String(formData.get("status")) as UserStatus,
      },
      user?.id,
      user ? undefined : String(formData.get("password")),
    );
  }

  return (
    <div className="dialog-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="user-dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">DIRECTORIO</span><h2 id="user-dialog-title">{user ? "Editar usuario" : "Nuevo usuario"}</h2></div>
          <button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}><X size={19} /></button>
        </div>
        <form key={user?.id ?? "new-user"} onSubmit={handleSubmit}>
          <label className="field"><span>Nombre completo</span><input name="name" defaultValue={user?.name} autoFocus required maxLength={80} placeholder="Ej. Alex García" /></label>
          {!user && <label className="field"><span>Contraseña inicial</span><input name="password" type="password" autoComplete="new-password" required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}" title="Usa al menos 8 caracteres, con mayúscula, minúscula, número y símbolo." placeholder="Define una contraseña segura" /><small className="password-guidance">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</small></label>}
          <div className="field-row">
            <label className="field"><span>Correo electrónico</span><input name="email" type="email" defaultValue={user?.email} required maxLength={120} placeholder="nombre@empresa.com" /></label>
            <label className="field"><span>Nombre de usuario</span><input name="username" defaultValue={user?.username} required minLength={3} maxLength={32} pattern="[a-zA-Z0-9._-]+" placeholder="nombre.apellido" /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>Equipo</span><input name="department" defaultValue={user?.department} required maxLength={60} placeholder="Ej. Operaciones" /></label>
            <label className="field"><span>Rol</span><select name="roleId" defaultValue={user?.roleId ?? roles[0]?.id} required>{roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label>
          </div>
          <label className="field"><span>Estado de la cuenta</span><select name="status" defaultValue={user?.status ?? "active"}>{(Object.keys(statusLabels) as UserStatus[]).map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></label>
          <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit" disabled={roles.length === 0}>{user ? "Guardar cambios" : "Crear usuario"}</button></div>
        </form>
      </section>
    </div>
  );
}
