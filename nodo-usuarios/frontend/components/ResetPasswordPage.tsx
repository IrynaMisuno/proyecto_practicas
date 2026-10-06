import { useState, type FormEvent } from "react";
import { useResetPassword } from "../hooks/useResetPassword";
import { AuthShell } from "./AuthShell";
import { BackToLogin } from "./BackToLogin";
import { PasswordChecklist, isStrongPassword } from "./PasswordChecklist";
import { Field, FormError, buttonStyles, inputStyles } from "./ui";

interface ResetPasswordPageProps {
  token: string;
  /** "invite": la persona acepta una invitación y elige su primera contraseña. */
  mode?: "reset" | "invite";
  onDone: (message: string) => void;
  onBack: () => void;
}

const texts = {
  reset: {
    title: "Elige una contraseña nueva",
    subtitle: "Al guardarla se cerrarán tus sesiones abiertas.",
    missingSubtitle: "Falta el código de recuperación.",
    missingHelp: "Abre el enlace completo que recibiste por correo o solicita uno nuevo desde «¿Has olvidado tu contraseña?».",
  },
  invite: {
    title: "Crea tu contraseña",
    subtitle: "Con ella entrarás en Nodo.",
    missingSubtitle: "Falta el código de la invitación.",
    missingHelp: "Abre el enlace completo que recibiste por correo. Si ha caducado, pide a un administrador que te reenvíe la invitación.",
  },
};

export function ResetPasswordPage({ token, mode = "reset", onDone, onBack }: ResetPasswordPageProps) {
  const text = texts[mode];
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
      <AuthShell title="Enlace no válido" subtitle={text.missingSubtitle} footer={<BackToLogin onClick={onBack} />}>
        <p className="text-center text-sm text-slate-600">{text.missingHelp}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={text.title} subtitle={text.subtitle} footer={<BackToLogin onClick={onBack} />}>
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
