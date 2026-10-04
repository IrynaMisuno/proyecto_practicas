import { useState, type FormEvent } from "react";
import { ApiError } from "../data";
import type { Role, User, UserDraft, UserStatus } from "../types";
import { PasswordChecklist, isStrongPassword } from "./PasswordChecklist";
import { Field, FormError, Modal, buttonStyles, inputStyles, statusLabels } from "./ui";

interface UserDialogProps {
  user?: User;
  roles: Role[];
  isSelf: boolean;
  onClose: () => void;
  onSubmit: (draft: UserDraft) => Promise<void>;
}

export function UserDialog({ user, roles, isSelf, onClose, onSubmit }: UserDialogProps) {
  const [draft, setDraft] = useState<UserDraft>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role_id: user?.role_id ?? roles[0]?.id ?? "",
    status: user?.status ?? "active",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const password = draft.password ?? "";
  const passwordValid = isStrongPassword(password);
  const passwordRequired = !user;

  function update<K extends keyof UserDraft>(field: K, value: UserDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((passwordRequired || password) && !passwordValid) {
      setFieldErrors((current) => ({ ...current, password: "La contraseña no cumple los requisitos." }));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await onSubmit({ ...draft, name: draft.name.trim(), email: draft.email.trim(), password: password || undefined });
    } catch (caught) {
      if (caught instanceof ApiError && Object.keys(caught.fields).length) setFieldErrors(caught.fields);
      else if (caught instanceof ApiError && caught.status === 409 && caught.message.includes("email")) setFieldErrors({ email: caught.message });
      else setFormError(caught instanceof Error ? caught.message : "No se pudo guardar el usuario.");
      setSaving(false);
    }
  }

  return (
    <Modal title={user ? "Editar usuario" : "Nuevo usuario"} description={user ? user.email : "La persona podrá entrar con su email y esta contraseña."} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError message={formError} />
        <Field label="Nombre completo" error={fieldErrors.name}>
          <input className={inputStyles} required maxLength={80} value={draft.name} aria-invalid={Boolean(fieldErrors.name)} onChange={(event) => update("name", event.target.value)} placeholder="Alex García" />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <input className={inputStyles} type="email" required maxLength={254} autoComplete="off" value={draft.email} aria-invalid={Boolean(fieldErrors.email)} onChange={(event) => update("email", event.target.value)} placeholder="nombre@empresa.com" />
        </Field>
        <Field
          label={user ? "Nueva contraseña (opcional)" : "Contraseña"}
          error={fieldErrors.password}
          hint={user && !password ? <span className="block text-sm text-slate-500">Déjala vacía para mantener la actual.</span> : undefined}
        >
          <input className={inputStyles} type="password" autoComplete="new-password" required={passwordRequired} maxLength={128} value={password} aria-invalid={Boolean(fieldErrors.password)} onChange={(event) => update("password", event.target.value)} />
        </Field>
        {(passwordRequired || password) && <PasswordChecklist password={password} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rol" error={fieldErrors.role_id}>
            <select className={inputStyles} value={draft.role_id} onChange={(event) => update("role_id", event.target.value)}>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </Field>
          <Field label="Estado" error={fieldErrors.status} hint={isSelf ? <span className="block text-sm text-slate-500">No puedes desactivar tu cuenta.</span> : undefined}>
            <select className={inputStyles} value={draft.status} disabled={isSelf} onChange={(event) => update("status", event.target.value as UserStatus)}>
              {(Object.keys(statusLabels) as UserStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={buttonStyles.secondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={buttonStyles.primary} disabled={saving || roles.length === 0}>{saving ? "Guardando…" : user ? "Guardar cambios" : "Crear usuario"}</button>
        </div>
      </form>
    </Modal>
  );
}
