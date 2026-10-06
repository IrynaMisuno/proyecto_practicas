import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { adminRole, ana, luis } from "../test-utils/fixtures";
import { UserRow } from "./UserRow";

function renderRow(props: Partial<ComponentProps<typeof UserRow>> = {}) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onResendInvitation: vi.fn() };
  // Una fila solo es válida dentro de una tabla.
  render(<table><tbody><UserRow user={ana} role={adminRole} isSelf={false} canWrite {...handlers} {...props} /></tbody></table>);
  return handlers;
}

describe("UserRow", () => {
  it("muestra nombre, email, rol, estado y fecha", () => {
    renderRow();

    const row = screen.getByRole("row");
    expect(row).toHaveTextContent("Ana Pérez");
    expect(row).toHaveTextContent("ana@example.com");
    expect(row).toHaveTextContent("Administrador");
    expect(row).toHaveTextContent("Activo");
    expect(row).toHaveTextContent("05 mar 2026");
  });

  it("permite editar y eliminar a otra persona", async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderRow();

    await user.click(screen.getByRole("button", { name: "Editar a Ana Pérez" }));
    await user.click(screen.getByRole("button", { name: "Eliminar a Ana Pérez" }));

    expect(onEdit).toHaveBeenCalledWith(ana);
    expect(onDelete).toHaveBeenCalledWith(ana);
  });

  it("permite reenviar la invitación solo a usuarios invitados", async () => {
    const user = userEvent.setup();
    const { onResendInvitation } = renderRow({ user: luis });

    await user.click(screen.getByRole("button", { name: "Reenviar invitación a Luis Gómez" }));

    expect(onResendInvitation).toHaveBeenCalledWith(luis);
  });

  it("no ofrece reenviar la invitación a usuarios activos", () => {
    renderRow();

    expect(screen.queryByRole("button", { name: /Reenviar invitación/ })).not.toBeInTheDocument();
  });

  it("marca tu propia fila y no te deja eliminarte", () => {
    renderRow({ isSelf: true });

    expect(screen.getByText("(tú)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar a Ana Pérez" })).toBeDisabled();
  });

  it("oculta las acciones sin permiso de escritura", () => {
    renderRow({ canWrite: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("indica si el usuario no tiene rol", () => {
    renderRow({ role: undefined });

    expect(screen.getByText("Sin rol")).toBeInTheDocument();
  });
});
