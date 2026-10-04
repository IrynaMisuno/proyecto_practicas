import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShieldCheck, Users } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { currentAdmin } from "../test/fixtures";
import { Sidebar, type SidebarSection } from "./Sidebar";

const sections: SidebarSection[] = [
  { id: "users", label: "Usuarios", icon: Users },
  { id: "roles", label: "Roles", icon: ShieldCheck },
];

function renderSidebar() {
  const handlers = { onSelect: vi.fn(), onLogout: vi.fn() };
  render(<Sidebar sections={sections} activeSection="users" currentUser={currentAdmin} {...handlers} />);
  return handlers;
}

describe("Sidebar", () => {
  it("marca la sección activa y cambia de sección", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSidebar();

    expect(screen.getByRole("button", { name: "Usuarios" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Roles" }));

    expect(onSelect).toHaveBeenCalledWith("roles");
  });

  it("muestra quién tiene la sesión abierta", () => {
    renderSidebar();

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });

  it("cierra la sesión desde la versión móvil y la de escritorio", async () => {
    const user = userEvent.setup();
    const { onLogout } = renderSidebar();

    // jsdom no aplica CSS: los dos botones (móvil y escritorio) están en el DOM.
    for (const button of screen.getAllByRole("button", { name: "Cerrar sesión" })) await user.click(button);

    expect(onLogout).toHaveBeenCalledTimes(2);
  });
});
