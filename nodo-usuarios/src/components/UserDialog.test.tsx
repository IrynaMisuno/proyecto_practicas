import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";
import { adminRole, ana, roles } from "../test/fixtures";
import { UserDialog } from "./UserDialog";

async function inviteNewUser() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nombre completo"), "  Marta Díaz ");
  await user.type(screen.getByLabelText("Email"), "marta@example.com");
  await user.click(screen.getByRole("button", { name: "Enviar invitación" }));
}

describe("UserDialog", () => {
  it("al dar de alta no pide contraseña ni estado: se envía una invitación", () => {
    render(<UserDialog roles={roles} isSelf={false} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Nuevo usuario" })).toHaveTextContent("Recibirá un email con un enlace para elegir su contraseña.");
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Estado/)).not.toBeInTheDocument();
  });

  it("envía solo nombre recortado, email y rol del usuario invitado", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<UserDialog roles={roles} isSelf={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await inviteNewUser();

    expect(onSubmit).toHaveBeenCalledWith({ name: "Marta Díaz", email: "marta@example.com", role_id: adminRole.id });
  });

  it("al editar no envía una contraseña nueva que no cumple la política", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UserDialog user={ana} roles={roles} isSelf={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/^Nueva contraseña/), "corta");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(screen.getByRole("alert")).toHaveTextContent("La contraseña no cumple los requisitos.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("muestra junto al campo el error que devuelve la API", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Datos no válidos.", 422, { email: "Ya existe un usuario con ese email." }));
    render(<UserDialog roles={roles} isSelf={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await inviteNewUser();

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un usuario con ese email.");
  });

  it("al editarte a ti misma no deja cambiar tu estado", () => {
    render(<UserDialog user={ana} roles={roles} isSelf onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Editar usuario" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Estado/)).toBeDisabled();
    expect(screen.getByText("No puedes desactivar tu cuenta.")).toBeInTheDocument();
  });
});
