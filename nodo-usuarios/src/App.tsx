import { useCallback, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { LoginPage } from "./components/LoginPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { useAuth } from "./hooks/useAuth";

type PublicPage = { name: "login"; notice?: string } | { name: "forgot" } | { name: "reset"; token: string };

const RESET_PATH = "/restablecer-contrasena";

function initialPublicPage(): PublicPage {
  if (window.location.pathname !== RESET_PATH) return { name: "login" };
  // El token llega en el fragmento (#token=...). Se guarda en memoria y se quita de la barra
  // de direcciones para que no quede en el historial.
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
  window.history.replaceState(null, "", RESET_PATH);
  return { name: "reset", token };
}

function goTo(path: string) {
  if (window.location.pathname !== path) window.history.replaceState(null, "", path);
}

/** Elige la pantalla: carga, recuperación de contraseña, login o panel. */
export default function App() {
  const { user, loading, logout, sessionExpired } = useAuth();
  const [page, setPage] = useState<PublicPage>(initialPublicPage);

  const showLogin = useCallback((notice?: string) => {
    goTo("/");
    setPage({ name: "login", notice });
  }, []);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-400"><LoaderCircle className="animate-spin" aria-label="Cargando" /></div>;
  }
  // Un enlace de recuperación se atiende aunque haya una sesión abierta en este navegador.
  if (page.name === "reset") {
    return (
      <ResetPasswordPage
        token={page.token}
        onBack={() => showLogin()}
        onDone={(message) => {
          void logout();
          showLogin(message);
        }}
      />
    );
  }
  if (user) return <Dashboard currentUser={user} />;
  if (page.name === "forgot") return <ForgotPasswordPage onBack={() => showLogin()} />;
  const notice = page.notice ?? (sessionExpired ? "Tu sesión ha caducado. Vuelve a iniciar sesión; los últimos cambios no se han guardado." : undefined);
  return <LoginPage notice={notice} noticeTone={page.notice ? "success" : "warning"} onForgotPassword={() => setPage({ name: "forgot" })} />;
}
