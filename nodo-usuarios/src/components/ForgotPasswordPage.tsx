import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { AuthShell } from "./AuthShell";
import { BackToLogin } from "./BackToLogin";
import { Field, FormError, buttonStyles, inputStyles } from "./ui";

export function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const { sentMessage, error, submitting, send } = useForgotPassword();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(email.trim());
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
