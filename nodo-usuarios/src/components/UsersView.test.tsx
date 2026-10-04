import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ana, roles, users } from "../test/fixtures";
import { UsersView } from "./UsersView";

function renderView(props: Partial<ComponentProps<typeof UsersView>> = {}) {
  const handlers = { onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(<UsersView users={users} roles={roles} currentUserId={ana.id} canWrite {...handlers} {...props} />);
  return handlers;
}

describe("UsersView", () => {
  it("lista todos los usuarios", () => {
    renderView();

    expect(screen.getByText("Mostrando 3 de 3")).toBeInTheDocument();
  });

  it("filtra por nombre o email", async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText("Buscar usuarios"), "luis@");

    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 de 3")).toBeInTheDocument();
  });

  it("avisa cuando ningún usuario coincide", async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(screen.getByLabelText("Buscar usuarios"), "nadie");

    expect(screen.getByText("No hay usuarios que coincidan")).toBeInTheDocument();
  });

  it("muestra «Añadir usuario» solo con permiso de escritura", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderView();

    await user.click(screen.getByRole("button", { name: "Añadir usuario" }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("oculta «Añadir usuario» sin permiso de escritura", () => {
    renderView({ canWrite: false });

    expect(screen.queryByRole("button", { name: "Añadir usuario" })).not.toBeInTheDocument();
  });
});
