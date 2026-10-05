import { useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "../errors";
import type { Permission, PermissionInfo, Role, RoleDraft, RoleTone } from "../types";
import { Field, FormError, Modal, buttonStyles, inputStyles, toneStyles } from "./ui";

const toneLabels: Record<RoleTone, string> = {
  slate: "Gris",
  mint: "Menta",
  sky: "Azul",
  violet: "Lavanda",
  amber: "Ámbar",
  rose: "Rosa",
};

interface RoleDialogProps {
  role?: Role;
  permissions: PermissionInfo[];
  onClose: () => void;
  onSubmit: (draft: RoleDraft) => Promise<void>;
}

export function RoleDialog({ role, permissions, onClose, onSubmit }: RoleDialogProps) {
  const [draft, setDraft] = useState<RoleDraft>({
    name: role?.name ?? "",
    description: role?.description ?? "",
    tone: role?.tone ?? "slate",
    permissions: role?.permissions ?? [],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function togglePermission(permission: Permission) {
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setFieldErrors({});
    try {
      await onSubmit({ ...draft, name: draft.name.trim(), description: draft.description.trim() });
    } catch (caught) {
      if (caught instanceof ApiError && Object.keys(caught.fields).length) setFieldErrors(caught.fields);
      else if (caught instanceof ApiError && caught.status === 409 && caught.message.includes("nombre")) setFieldErrors({ name: caught.message });
      else setFormError(errorMessage(caught, "No se pudo guardar el rol."));
      setSaving(false);
    }
  }

  return (
    <Modal title={role ? "Editar rol" : "Nuevo rol"} description="Los permisos se comprueban en el servidor en cada operación." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Nombre" error={fieldErrors.name}>
          <input className={inputStyles} required maxLength={40} value={draft.name} aria-invalid={Boolean(fieldErrors.name)} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Analista" />
        </Field>
        <Field label="Descripción" error={fieldErrors.description}>
          <textarea className={inputStyles} rows={2} maxLength={160} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Qué puede hacer este rol" />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Permisos</legend>
          <div className="mt-2 divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
            {permissions.map((permission) => (
              <label key={permission.key} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50">
                <input type="checkbox" className="h-4 w-4 rounded-sm border-slate-300 text-mint-700 focus:ring-mint-600" checked={draft.permissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} />
                <span className="flex-1 text-slate-700">{permission.label}</span>
                <code className="text-xs text-slate-400">{permission.key}</code>
              </label>
            ))}
          </div>
          {fieldErrors.permissions && <p className="mt-1.5 text-sm text-rose-600">{fieldErrors.permissions}</p>}
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Color</legend>
          <div className="mt-2 flex gap-2">
            {(Object.keys(toneLabels) as RoleTone[]).map((tone) => (
              <label key={tone} title={toneLabels[tone]} className="cursor-pointer">
                <input type="radio" name="tone" className="peer sr-only" checked={draft.tone === tone} onChange={() => setDraft({ ...draft, tone })} />
                <span className={`block h-7 w-7 rounded-full ring-2 ring-transparent ring-offset-2 peer-checked:ring-slate-900 peer-focus-visible:ring-mint-600 ${toneStyles[tone].swatch}`} />
                <span className="sr-only">{toneLabels[tone]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={buttonStyles.secondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={buttonStyles.primary} disabled={saving}>{saving ? "Guardando…" : role ? "Guardar cambios" : "Crear rol"}</button>
        </div>
      </form>
    </Modal>
  );
}
