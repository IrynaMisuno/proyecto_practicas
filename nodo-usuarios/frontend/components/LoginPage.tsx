import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { errorMessage } from "../errors";
import { useAuth } from "../hooks/useAuth";
import { AuthShell } from "./AuthShell";
import { Field, FormError, buttonStyles, inputStyles, linkStyles } from "./ui";

interface LoginPageProps {
  notice?: string;
  noticeTone?: "success" | "warning";
  onForgotPassword: () => void;
}

export function LoginPage({ notice, noticeTone = "success", onForgotPassword }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
    } catch (caught) {
      setError(errorMessage(caught, "No se pudo iniciar sesión."));
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Inicia sesión en Nodo" subtitle="Panel de administración de usuarios">
      <form onSubmit={handleSubmit} className="space-y-5">
        {notice && !error && <p className={`rounded-lg px-3 py-2 text-sm ring-1 ring-inset ${noticeTone === "warning" ? "bg-amber-50 text-amber-900 ring-amber-600/20" : "bg-mint-50 text-mint-800 ring-mint-600/20"}`} role="status">{notice}</p>}
        <FormError message={error} />
        <Field label="Email">
          <input className={inputStyles} type="email" name="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" />
        </Field>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Contraseña</label>
            <button type="button" className={`text-sm ${linkStyles}`} onClick={onForgotPassword}>¿Has olvidado tu contraseña?</button>
          </div>
          <input id="login-password" className={inputStyles} type="password" name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {/* La contraseña nunca la guarda la app: de eso se encarga el gestor de contraseñas del navegador. */}
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded-sm border-slate-300 text-mint-700 focus:ring-mint-600" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          Recordarme en este equipo
        </label>
        <button type="submit" className={`${buttonStyles.primary} w-full`} disabled={submitting}>
          <LogIn size={16} /> {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
