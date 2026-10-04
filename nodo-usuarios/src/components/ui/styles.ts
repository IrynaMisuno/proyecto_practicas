import type { RoleTone } from "../../types";

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const iconBase = "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export const buttonStyles = {
  primary: `${buttonBase} bg-indigo-600 text-white shadow-sm hover:bg-indigo-500`,
  secondary: `${buttonBase} border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50`,
  danger: `${buttonBase} bg-rose-600 text-white shadow-sm hover:bg-rose-500`,
  icon: iconBase,
  iconDanger: `${iconBase} hover:bg-rose-50 hover:text-rose-600`,
};

export const inputStyles = "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:ring-rose-500";

export const linkStyles = "font-medium text-indigo-600 hover:text-indigo-500";

export const toneStyles: Record<RoleTone, { badge: string; dot: string; swatch: string }> = {
  slate: { badge: "bg-slate-100 text-slate-700 ring-slate-500/20", dot: "bg-slate-500", swatch: "bg-slate-500" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dot: "bg-indigo-500", swatch: "bg-indigo-500" },
  emerald: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500", swatch: "bg-emerald-500" },
  amber: { badge: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500", swatch: "bg-amber-500" },
  rose: { badge: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500", swatch: "bg-rose-500" },
  sky: { badge: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500", swatch: "bg-sky-500" },
};
