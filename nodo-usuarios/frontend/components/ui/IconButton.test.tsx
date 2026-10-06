import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("tiene nombre accesible y avisa al pulsarlo", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton label="Cerrar" icon={<svg />} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("usa la etiqueta como texto de ayuda si no se indica otro", () => {
    render(<IconButton label="Cerrar sesión" icon={<svg />} />);

    expect(screen.getByRole("button")).toHaveAttribute("title", "Cerrar sesión");
  });

  it("no hace nada si está desactivado", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton label="Eliminar" icon={<svg />} disabled onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
