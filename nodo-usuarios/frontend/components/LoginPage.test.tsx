import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";
import { useAuth } from "../hooks/useAuth";
import { authValue } from "../test-utils/fixtures";
import { LoginPage } from "./LoginPage";

// Sustituye el hook por una versión simulada: el test no hace peticiones reales.
vi.mock("../hooks/useAuth");

const login = vi.fn();

beforeEach(() => {
  login.mockReset();
  vi.mocked(useAuth).mockReturnValue(authValue({ user: null, login }));
});

async function submit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Contraseña"), password);
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginPage", () => {
  it("inicia sesión con el email y la contraseña", async () => {
    render(<LoginPage onForgotPassword={vi.fn()} />);

    await submit("ana@example.com", "Segura-2026x");

    expect(login).toHaveBeenCalledWith("ana@example.com", "Segura-2026x", false);
  });

  it("pide recordar la sesión si se marca «Recordarme en este equipo»", async () => {
    render(<LoginPage onForgotPassword={vi.fn()} />);

    await userEvent.setup().click(screen.getByRole("checkbox", { name: "Recordarme en este equipo" }));
    await submit("ana@example.com", "Segura-2026x");

    expect(login).toHaveBeenCalledWith("ana@example.com", "Segura-2026x", true);
  });

  it("prepara los campos para el gestor de contraseñas del navegador", () => {
    render(<LoginPage onForgotPassword={vi.fn()} />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autocomplete", "current-password");
  });

  it("muestra el error y vacía la contraseña si falla", async () => {
    login.mockRejectedValue(new ApiError("Email o contraseña incorrectos.", 401));
    render(<LoginPage onForgotPassword={vi.fn()} />);

    await submit("ana@example.com", "incorrecta");

    expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos.");
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");
  });

  it("muestra el aviso recibido", () => {
    render(<LoginPage notice="Contraseña cambiada." onForgotPassword={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Contraseña cambiada.");
  });

  it("lleva a la recuperación de contraseña", async () => {
    const user = userEvent.setup();
    const onForgotPassword = vi.fn();
    render(<LoginPage onForgotPassword={onForgotPassword} />);

    await user.click(screen.getByRole("button", { name: "¿Has olvidado tu contraseña?" }));

    expect(onForgotPassword).toHaveBeenCalledOnce();
  });
});
