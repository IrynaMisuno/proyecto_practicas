import { LogOut, type LucideIcon } from "lucide-react";
import type { CurrentUser } from "../types";
import { Avatar, IconButton, Logo } from "./ui";

export type Section = "users" | "roles";

export interface SidebarSection {
  id: Section;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  sections: SidebarSection[];
  activeSection?: Section;
  currentUser: CurrentUser;
  onSelect: (section: Section) => void;
  onLogout: () => void;
}

/** Navegación del panel; en móvil es una barra superior y en escritorio una columna lateral. */
export function Sidebar({ sections, activeSection, currentUser, onSelect, onLogout }: SidebarProps) {
  const logoutIcon = <LogOut size={18} />;

  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6 lg:py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Nodo</span>
        </div>
        <IconButton className="lg:hidden" label="Cerrar sesión" icon={logoutIcon} onClick={onLogout} />
      </div>
      <nav aria-label="Secciones" className="flex gap-1 px-4 pb-3 lg:flex-1 lg:flex-col lg:px-3 lg:pb-0">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={activeSection === item.id ? "page" : undefined}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeSection === item.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="hidden border-t border-slate-200 p-4 lg:block">
        <div className="flex items-center gap-3">
          <Avatar name={currentUser.name} tone="slate" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{currentUser.name}</p>
            <p className="truncate text-xs text-slate-500">{currentUser.role_name}</p>
          </div>
          <IconButton label="Cerrar sesión" icon={logoutIcon} onClick={onLogout} />
        </div>
      </div>
    </aside>
  );
}
