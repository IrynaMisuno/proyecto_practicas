import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { permissions, roles, users } from "../test-utils/fixtures";
import { RolesView } from "./RolesView";

describe("RolesView", () => {
  it("muestra una tarjeta por rol con sus usuarios asignados", () => {
    render(<RolesView roles={roles} users={users} permissions={permissions} canWrite={false} onAdd={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "Administrador" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Lector" })).toBeInTheDocument();
    expect(screen.getByText("1 usuario asignado")).toBeInTheDocument();
    expect(screen.getByText("2 usuarios asignados")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Crear rol" })).not.toBeInTheDocument();
  });

  it("permite crear un rol con permiso de escritura", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<RolesView roles={roles} users={null} permissions={permissions} canWrite onAdd={onAdd} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Crear rol" }));

    expect(onAdd).toHaveBeenCalledOnce();
  });
});
