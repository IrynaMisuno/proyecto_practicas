import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { Role, RoleDraft, RoleTone } from "../types";

interface RoleDialogProps {
  open: boolean;
  role?: Role;
  onClose: () => void;
  onSave: (draft: RoleDraft, roleId?: string) => void;
}

const tones: { value: RoleTone; label: string }[] = [
  { value: "moss", label: "Verde" },
  { value: "coral", label: "Coral" },
  { value: "gold", label: "Oro" },
  { value: "blue", label: "Azul" },
  { value: "ink", label: "Grafito" },
];

export function RoleDialog({ open, role, onClose, onSave }: RoleDialogProps) {
  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSave(
      {
        name: String(formData.get("name")).trim(),
        description: String(formData.get("description")).trim(),
        tone: String(formData.get("tone")) as RoleTone,
      },
      role?.id,
    );
  }

  return (
    <div className="dialog-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="role-dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">PERMISOS</span><h2 id="role-dialog-title">{role ? "Editar rol" : "Nuevo rol"}</h2></div>
          <button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}><X size={19} /></button>
        </div>
        <form key={role?.id ?? "new-role"} onSubmit={handleSubmit}>
          <label className="field"><span>Nombre del rol</span><input name="name" defaultValue={role?.name} autoFocus required maxLength={40} placeholder="Ej. Analista" /></label>
          <label className="field"><span>Descripción</span><textarea name="description" defaultValue={role?.description} required maxLength={120} rows={3} placeholder="Describe brevemente sus permisos" /></label>
          <fieldset className="field tone-picker"><legend>Identificador de color</legend><div className="tone-options">{tones.map((tone) => <label className={`tone-option tone-${tone.value}`} key={tone.value} title={tone.label}><input type="radio" name="tone" value={tone.value} defaultChecked={role?.tone === tone.value || (!role && tone.value === "moss")} /><span className="sr-only">{tone.label}</span></label>)}</div></fieldset>
          <div className="dialog-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit">{role ? "Guardar cambios" : "Crear rol"}</button></div>
        </form>
      </section>
    </div>
  );
}
