import { Check, Circle } from "lucide-react";

// Misma política que valida el backend (backend/app/schemas.py).
const passwordRules = [
  { label: "Al menos 10 caracteres", test: (value: string) => value.length >= 10 },
  { label: "Una mayúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Una minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Un número", test: (value: string) => /[0-9]/.test(value) },
  { label: "Un símbolo", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function isStrongPassword(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-1 gap-1.5 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2" aria-label="Requisitos de la contraseña">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-2 ${ok ? "text-emerald-700" : "text-slate-500"}`}>
            {ok ? <Check size={14} aria-hidden /> : <Circle size={14} aria-hidden />}
            {rule.label}<span className="sr-only">{ok ? ": cumplido" : ": pendiente"}</span>
          </li>
        );
      })}
    </ul>
  );
}
