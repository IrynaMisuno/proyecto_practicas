import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import type { RoleTone, UserStatus } from "../types";

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const buttonStyles = {
  primary: `${buttonBase} bg-indigo-600 text-white shadow-sm hover:bg-indigo-500`,
  secondary: `${buttonBase} border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50`,
  danger: `${buttonBase} bg-rose-600 text-white shadow-sm hover:bg-rose-500`,
  icon: "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
};

export const inputStyles = "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:ring-rose-500";

export const toneStyles: Record<RoleTone, { badge: string; dot: string; swatch: string }> = {
  slate: { badge: "bg-slate-100 text-slate-700 ring-slate-500/20", dot: "bg-slate-500", swatch: "bg-slate-500" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dot: "bg-indigo-500", swatch: "bg-indigo-500" },
  emerald: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500", swatch: "bg-emerald-500" },
  amber: { badge: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500", swatch: "bg-amber-500" },
  rose: { badge: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500", swatch: "bg-rose-500" },
  sky: { badge: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500", swatch: "bg-sky-500" },
};

export const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
};

const statusStyles: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  invited: "bg-amber-50 text-amber-800 ring-amber-600/20",
  suspended: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function RoleBadge({ name, tone }: { name: string; tone: RoleTone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneStyles[tone].badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneStyles[tone].dot}`} />
      {name}
    </span>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}

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

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20" role="alert">{message}</p>;
}

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md";
}

export function Modal({ title, description, onClose, children, size = "md" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Solo al abrir: enfoca el primer campo y devuelve el foco al cerrar.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const firstInput = panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button[type=submit]");
    firstInput?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 ${size === "sm" ? "max-w-md" : "max-w-lg"}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button type="button" className={buttonStyles.icon} aria-label="Cerrar" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg" role="status">
      {message}
    </div>
  );
}

export function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
