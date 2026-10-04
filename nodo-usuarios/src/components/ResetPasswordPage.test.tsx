import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useResetPassword } from "../hooks/useResetPassword";
import { ResetPasswordPage } from "./ResetPasswordPage";

vi.mock("../hooks/useResetPassword");

function mockHook(result: string | null = "Contraseña cambiada.") {
  const hook = { fieldError: "", setFieldError: vi.fn(), error: "", submitting: false, submit: vi.fn().mockResolvedValue(result) };
  vi.mocked(useResetPassword).mockReturnValue(hook);
  return hook;
}

async function choosePassword(password: string, confirmation = password) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Contraseña nueva"), password);
  await user.type(screen.getByLabelText("Repite la contraseña"), confirmation);
  await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));
}

describe("ResetPasswordPage", () => {
  it("avisa si el enlace no trae token", () => {
    mockHook();
    render(<ResetPasswordPage token="" onDone={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Enlace no válido" })).toBeInTheDocument();
  });

  it("no envía una contraseña que no cumple la política", async () => {
    const hook = mockHook();
    render(<ResetPasswordPage token="abc" onDone={vi.fn()} onBack={vi.fn()} />);

    await choosePassword("corta");

    expect(hook.setFieldError).toHaveBeenLastCalledWith("La contraseña no cumple los requisitos.");
    expect(hook.submit).not.toHaveBeenCalled();
  });

  it("no deja guardar si las contraseñas no coinciden", async () => {
    mockHook();
    render(<ResetPasswordPage token="abc" onDone={vi.fn()} onBack={vi.fn()} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Contraseña nueva"), "Segura-2026x");
    await user.type(screen.getByLabelText("Repite la contraseña"), "Otra-2026x");

    expect(screen.getByRole("alert")).toHaveTextContent("Las contraseñas no coinciden.");
    expect(screen.getByRole("button", { name: "Guardar contraseña" })).toBeDisabled();
  });

  it("guarda la contraseña y avisa con el mensaje del servidor", async () => {
    const hook = mockHook("Contraseña cambiada.");
    const onDone = vi.fn();
    render(<ResetPasswordPage token="abc" onDone={onDone} onBack={vi.fn()} />);

    await choosePassword("Segura-2026x");

    expect(hook.submit).toHaveBeenCalledWith("Segura-2026x");
    expect(onDone).toHaveBeenCalledWith("Contraseña cambiada.");
  });

  it("no termina si el servidor rechaza el cambio", async () => {
    mockHook(null);
    const onDone = vi.fn();
    render(<ResetPasswordPage token="abc" onDone={onDone} onBack={vi.fn()} />);

    await choosePassword("Segura-2026x");

    expect(onDone).not.toHaveBeenCalled();
  });
});
