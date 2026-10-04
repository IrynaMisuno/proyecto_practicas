import { useState, type FormEvent } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { ApiError, requestPasswordReset, resetPassword } from "../data";
import { AuthShell, linkStyles } from "./AuthShell";
import { PasswordChecklist, isStrongPassword } from "./PasswordChecklist";
import { Field, FormError, buttonStyles, inputStyles } from "./ui";

function BackToLogin({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={`inline-flex items-center gap-1.5 ${linkStyles}`} onClick={onClick}>
      <ArrowLeft size={14} /> Volver a iniciar sesión
    </button>
  );
}

export function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      setSentMessage((await requestPasswordReset(email.trim())).message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sentMessage) {
    return (
      <AuthShell title="Revisa tu correo" subtitle={email.trim()} footer={<BackToLogin onClick={onBack} />}>
        <div className="space-y-3 text-center">
          <MailCheck className="mx-auto text-indigo-600" size={32} aria-hidden />
          <p className="text-sm text-slate-600" role="status">{sentMessage}</p>
          <p className="text-sm text-slate-500">El enlace caduca pronto y solo se puede usar una vez. Si no lo ves, revisa la carpeta de spam.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="¿Has olvidado tu contraseña?" subtitle="Te enviaremos un enlace para elegir una nueva." footer={<BackToLogin onClick={onBack} />}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormError message={error} />
        <Field label="Email">
          <input className={inputStyles} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" />
        </Field>
        <button type="submit" className={`${buttonStyles.primary} w-full`} disabled={submitting}>{submitting ? "Enviando…" : "Enviar enlace"}</button>
      </form>
    </AuthShell>
  );
}

interface ResetPasswordPageProps {
  token: string;
  onDone: (message: string) => void;
  onBack: () => void;
}

export function ResetPasswordPage({ token, onDone, onBack }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirmation.length > 0 && confirmation !== password;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isStrongPassword(password)) {
      setFieldError("La contraseña no cumple los requisitos.");
      return;
    }
    if (password !== confirmation) return;
    setSubmitting(true);
    try {
      onDone((await resetPassword(token, password)).message);
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields.password) setFieldError(caught.fields.password);
      else setError(caught instanceof Error ? caught.message : "No se pudo cambiar la contraseña.");
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Enlace no válido" subtitle="Falta el código de recuperación." footer={<BackToLogin onClick={onBack} />}>
        <p className="text-center text-sm text-slate-600">Abre el enlace completo que recibiste por correo o solicita uno nuevo desde «¿Has olvidado tu contraseña?».</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Elige una contraseña nueva" subtitle="Al guardarla se cerrarán tus sesiones abiertas." footer={<BackToLogin onClick={onBack} />}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormError message={error} />
        <Field label="Contraseña nueva" error={fieldError}>
          <input className={inputStyles} type="password" autoComplete="new-password" required maxLength={128} value={password} aria-invalid={Boolean(fieldError)} onChange={(event) => { setPassword(event.target.value); setFieldError(""); }} />
        </Field>
        <PasswordChecklist password={password} />
        <Field label="Repite la contraseña" error={mismatch ? "Las contraseñas no coinciden." : undefined}>
          <input className={inputStyles} type="password" autoComplete="new-password" required maxLength={128} value={confirmation} aria-invalid={mismatch} onChange={(event) => setConfirmation(event.target.value)} />
        </Field>
        <button type="submit" className={`${buttonStyles.primary} w-full`} disabled={submitting || mismatch || !confirmation}>{submitting ? "Guardando…" : "Guardar contraseña"}</button>
      </form>
    </AuthShell>
  );
}
