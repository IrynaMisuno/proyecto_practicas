import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";
import { adminRole, ana, roles } from "../test/fixtures";
import { UserDialog } from "./UserDialog";

async function fillNewUser(password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nombre completo"), "  Marta Díaz ");
  await user.type(screen.getByLabelText("Email"), "marta@example.com");
  await user.type(screen.getByLabelText("Contraseña"), password);
  await user.click(screen.getByRole("button", { name: "Crear usuario" }));
}

describe("UserDialog", () => {
  it("no envía una contraseña que no cumple la política", async () => {
    const onSubmit = vi.fn();
    render(<UserDialog roles={roles} isSelf={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await fillNewUser("corta");

    expect(screen.getByRole("alert")).toHaveTextContent("La contraseña no cumple los requisitos.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía el usuario nuevo con el nombre recortado", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<UserDialog roles={roles} isSelf={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await fillNewUser("Segura-2026x");

    expect(onSubmit).toHaveBeenCalledWith({ name: "Marta Díaz", email: "marta@example.com", role_id: adminRole.id, status: "active", password: "Segura-2026x" });
  });

  it("muestra junto al campo el error que devuelve la API", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Datos no válidos.", 422, { email: "Ya existe un usuario con ese email." }));
    render(<UserDialog roles={roles} isSelf={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await fillNewUser("Segura-2026x");

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un usuario con ese email.");
  });

  it("al editarte a ti misma no deja cambiar tu estado", () => {
    render(<UserDialog user={ana} roles={roles} isSelf onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Editar usuario" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Estado/)).toBeDisabled();
    expect(screen.getByText("No puedes desactivar tu cuenta.")).toBeInTheDocument();
  });
});
