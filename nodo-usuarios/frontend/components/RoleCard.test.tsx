import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { permissions, readerRole } from "../test-utils/fixtures";
import { RoleCard } from "./RoleCard";

const labels = new Map(permissions.map((permission) => [permission.key, permission.label]));

function renderCard(props: Partial<ComponentProps<typeof RoleCard>> = {}) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn() };
  render(<ul><RoleCard role={readerRole} permissionLabels={labels} assigned={0} canWrite {...handlers} {...props} /></ul>);
  return handlers;
}

describe("RoleCard", () => {
  it("muestra el nombre, los permisos con su texto y los usuarios asignados", () => {
    renderCard({ assigned: 2 });

    expect(screen.getByRole("heading", { name: "Lector" })).toBeInTheDocument();
    expect(screen.getByText("Sin descripción")).toBeInTheDocument();
    expect(screen.getByText("Ver usuarios")).toBeInTheDocument();
    expect(screen.getByText("2 usuarios asignados")).toBeInTheDocument();
  });

  it("no deja eliminar un rol asignado", () => {
    renderCard({ assigned: 1 });

    expect(screen.getByRole("button", { name: "Eliminar rol Lector" })).toBeDisabled();
  });

  it("permite editar y eliminar un rol sin usuarios", async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderCard();

    await user.click(screen.getByRole("button", { name: "Editar rol Lector" }));
    await user.click(screen.getByRole("button", { name: "Eliminar rol Lector" }));

    expect(onEdit).toHaveBeenCalledWith(readerRole);
    expect(onDelete).toHaveBeenCalledWith(readerRole);
  });

  it("oculta las acciones y el recuento cuando no corresponde", () => {
    renderCard({ canWrite: false, assigned: undefined, role: { ...readerRole, permissions: [] } });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/asignado/)).not.toBeInTheDocument();
    expect(screen.getByText("Sin permisos")).toBeInTheDocument();
  });
});
