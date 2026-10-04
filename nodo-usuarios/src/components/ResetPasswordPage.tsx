import { useState, type FormEvent } from "react";
import { useResetPassword } from "../hooks/useResetPassword";
import { AuthShell } from "./AuthShell";
import { BackToLogin } from "./BackToLogin";
import { PasswordChecklist, isStrongPassword } from "./PasswordChecklist";
import { Field, FormError, buttonStyles, inputStyles } from "./ui";

interface ResetPasswordPageProps {
  token: string;
  onDone: (message: string) => void;
  onBack: () => void;
}

export function ResetPasswordPage({ token, onDone, onBack }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { fieldError, setFieldError, error, submitting, submit } = useResetPassword(token);

  const mismatch = confirmation.length > 0 && confirmation !== password;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isStrongPassword(password)) {
      setFieldError("La contraseña no cumple los requisitos.");
      return;
    }
    if (password !== confirmation) return;
    const message = await submit(password);
    if (message) onDone(message);
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
