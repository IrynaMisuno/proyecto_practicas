import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

vi.mock("../hooks/useForgotPassword");

function mockHook(state: Partial<ReturnType<typeof useForgotPassword>> = {}) {
  const send = vi.fn();
  vi.mocked(useForgotPassword).mockReturnValue({ sentMessage: "", error: "", submitting: false, send, ...state });
  return send;
}

describe("ForgotPasswordPage", () => {
  it("pide el enlace para el email escrito", async () => {
    const user = userEvent.setup();
    const send = mockHook();
    render(<ForgotPasswordPage onBack={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(send).toHaveBeenCalledWith("ana@example.com");
  });

  it("muestra el error de la solicitud", () => {
    mockHook({ error: "No se pudo enviar la solicitud." });
    render(<ForgotPasswordPage onBack={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo enviar la solicitud.");
  });

  it("confirma el envío con el mensaje del servidor", () => {
    mockHook({ sentMessage: "Si el email existe, recibirás un enlace." });
    render(<ForgotPasswordPage onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Revisa tu correo" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Si el email existe, recibirás un enlace.");
  });
});
