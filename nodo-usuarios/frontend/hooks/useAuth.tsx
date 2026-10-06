import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "../data";
import type { CurrentUser, Permission } from "../types";

export interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  /** La sesión se cerró sola (caducada o invalidada), no porque la persona saliera. */
  sessionExpired: boolean;
  /** Con `remember`, la sesión dura 30 días y sobrevive al cierre del navegador. */
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.loadCurrentUser());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value: AuthContextValue = {
    user,
    loading,
    sessionExpired,
    refresh,
    login: async (email, password, remember) => {
      setUser(await api.login(email, password, remember));
      setSessionExpired(false);
    },
    logout: async () => {
      await api.logout().catch(() => undefined);
      setUser(null);
      setSessionExpired(false);
    },
    can: (permission) => user?.permissions.includes(permission) ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Sesión actual: usuario, login, logout y `can(permiso)`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
