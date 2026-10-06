import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="block text-sm text-rose-600" role="alert">{error}</span> : hint}
    </label>
  );
}
