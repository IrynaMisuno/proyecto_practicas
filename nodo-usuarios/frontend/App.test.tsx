import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useAuth } from "./hooks/useAuth";
import { useResetPassword } from "./hooks/useResetPassword";
import { authValue } from "./test-utils/fixtures";

vi.mock("./hooks/useAuth");
vi.mock("./hooks/useResetPassword");
// El panel tiene sus propios tests; aquí solo importa que App lo elija.
vi.mock("./components/Dashboard", () => ({ Dashboard: () => <p>Panel</p> }));

beforeEach(() => {
  vi.mocked(useResetPassword).mockReturnValue({ fieldError: "", setFieldError: vi.fn(), error: "", submitting: false, submit: vi.fn() });
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("App", () => {
  it("muestra un indicador mientras comprueba la sesión", () => {
    vi.mocked(useAuth).mockReturnValue(authValue({ user: null, loading: true }));
    render(<App />);

    expect(screen.getByLabelText("Cargando")).toBeInTheDocument();
  });

  it("muestra el login sin sesión", () => {
    vi.mocked(useAuth).mockReturnValue(authValue({ user: null }));
    render(<App />);

    expect(screen.getByRole("heading", { name: "Inicia sesión en Nodo" })).toBeInTheDocument();
  });

  it("avisa si la sesión ha caducado", () => {
    vi.mocked(useAuth).mockReturnValue(authValue({ user: null, sessionExpired: true }));
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Tu sesión ha caducado.");
  });

  it("muestra el panel con sesión", () => {
    vi.mocked(useAuth).mockReturnValue(authValue());
    render(<App />);

    expect(screen.getByText("Panel")).toBeInTheDocument();
  });

  it("atiende el enlace de recuperación y quita el token de la barra de direcciones", () => {
    window.history.replaceState(null, "", "/restablecer-contrasena#token=abc123");
    vi.mocked(useAuth).mockReturnValue(authValue());
    render(<App />);

    expect(screen.getByRole("heading", { name: "Elige una contraseña nueva" })).toBeInTheDocument();
    expect(useResetPassword).toHaveBeenCalledWith("abc123");
    expect(window.location.hash).toBe("");
  });

  it("atiende el enlace de invitación con la pantalla para crear la contraseña", () => {
    window.history.replaceState(null, "", "/aceptar-invitacion#token=inv456");
    vi.mocked(useAuth).mockReturnValue(authValue({ user: null }));
    render(<App />);

    expect(screen.getByRole("heading", { name: "Crea tu contraseña" })).toBeInTheDocument();
    expect(useResetPassword).toHaveBeenCalledWith("inv456");
    expect(window.location.pathname).toBe("/aceptar-invitacion");
    expect(window.location.hash).toBe("");
  });
});
