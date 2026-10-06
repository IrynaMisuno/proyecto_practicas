import type { RoleTone } from "../../types";

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const iconBase = "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export const buttonStyles = {
  primary: `${buttonBase} bg-mint-300 text-mint-950 shadow-xs hover:bg-mint-400`,
  secondary: `${buttonBase} border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-50`,
  danger: `${buttonBase} bg-rose-600 text-white shadow-xs hover:bg-rose-500`,
  icon: iconBase,
  iconDanger: `${iconBase} hover:bg-rose-50 hover:text-rose-600`,
};

export const inputStyles = "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-mint-600 disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:ring-rose-500";

export const linkStyles = "font-medium text-mint-700 hover:text-mint-800";

// Tonos pastel que combinan con el menta de la marca. El texto va en 800 sobre fondo 50/100 (contraste ≥ 4.5:1).
export const toneStyles: Record<RoleTone, { badge: string; dot: string; swatch: string; icon: string }> = {
  slate: { badge: "bg-slate-50 text-slate-700 ring-slate-300/60", dot: "bg-slate-400", swatch: "bg-slate-300", icon: "bg-slate-100 text-slate-700" },
  mint: { badge: "bg-mint-50 text-mint-800 ring-mint-300/60", dot: "bg-mint-400", swatch: "bg-mint-300", icon: "bg-mint-100 text-mint-800" },
  sky: { badge: "bg-sky-50 text-sky-800 ring-sky-300/60", dot: "bg-sky-400", swatch: "bg-sky-300", icon: "bg-sky-100 text-sky-800" },
  violet: { badge: "bg-violet-50 text-violet-800 ring-violet-300/60", dot: "bg-violet-400", swatch: "bg-violet-300", icon: "bg-violet-100 text-violet-800" },
  amber: { badge: "bg-amber-50 text-amber-800 ring-amber-300/60", dot: "bg-amber-400", swatch: "bg-amber-300", icon: "bg-amber-100 text-amber-800" },
  rose: { badge: "bg-rose-50 text-rose-800 ring-rose-300/60", dot: "bg-rose-400", swatch: "bg-rose-300", icon: "bg-rose-100 text-rose-800" },
};
