import { useState, type FormEvent } from "react";
import { KeyRound, X } from "lucide-react";
import { verifyDemoCredentials } from "../data";

interface AccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccessDialog({ open, onClose }: AccessDialogProps) {
  const [verified, setVerified] = useState<"valid" | "invalid" | "error" | null>(null);
  const [checking, setChecking] = useState(false);
  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setChecking(true);
    try {
      await verifyDemoCredentials(String(formData.get("identifier")), String(formData.get("password")));
      setVerified("valid");
    } catch (error) {
      setVerified(error instanceof Error && error.message === "Credenciales inválidas" ? "invalid" : "error");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="dialog-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog access-dialog" role="dialog" aria-modal="true" aria-labelledby="access-dialog-title">
        <div className="dialog-heading"><div className="access-mark"><KeyRound size={20} /></div><button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}><X size={19} /></button></div>
        <span className="eyebrow">VERIFICACIÓN LOCAL</span><h2 id="access-dialog-title">Comprobar acceso</h2>
        <p className="dialog-copy">Valida las credenciales contra el mock local. No inicia una sesión real.</p>
        <form onSubmit={handleSubmit} onChange={() => setVerified(null)}>
          <label className="field"><span>Usuario o correo</span><input name="identifier" autoComplete="username" required placeholder="admin@nodo.local" /></label>
          <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required placeholder="Introduce la contraseña demo" /></label>
          {verified !== null && <p className={`access-result ${verified === "valid" ? "is-valid" : "is-invalid"}`} role="status">{verified === "valid" ? "Credenciales válidas. Rol: Administrador." : verified === "invalid" ? "Credenciales incorrectas." : "No se pudo contactar con la API local."}</p>}
          <button className="button button-primary button-full" type="submit" disabled={checking}>{checking ? "Verificando…" : "Verificar credenciales"}</button>
          <p className="demo-hint">Demo: admin@nodo.local · NodoDemo2026!</p>
        </form>
      </section>
    </div>
  );
}
