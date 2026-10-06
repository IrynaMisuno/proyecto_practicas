import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";
import { permissions } from "../test-utils/fixtures";
import { RoleDialog } from "./RoleDialog";

async function createAnalyst() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nombre"), " Analista ");
  await user.click(screen.getByRole("checkbox", { name: /Ver usuarios/ }));
  await user.click(screen.getByRole("radio", { name: "Menta" }));
  await user.click(screen.getByRole("button", { name: "Crear rol" }));
}

describe("RoleDialog", () => {
  it("envía el rol nuevo con los permisos y el color elegidos", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RoleDialog permissions={permissions} onClose={vi.fn()} onSubmit={onSubmit} />);

    await createAnalyst();

    expect(onSubmit).toHaveBeenCalledWith({ name: "Analista", description: "", tone: "mint", permissions: ["users:read"] });
  });

  it("muestra en el campo nombre el conflicto por nombre repetido", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Ya existe un rol con ese nombre.", 409));
    render(<RoleDialog permissions={permissions} onClose={vi.fn()} onSubmit={onSubmit} />);

    await createAnalyst();

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un rol con ese nombre.");
    expect(screen.getByRole("textbox", { name: /Nombre/ })).toHaveAttribute("aria-invalid", "true");
  });
});
