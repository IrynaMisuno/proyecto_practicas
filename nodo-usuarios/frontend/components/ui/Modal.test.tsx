import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("es un diálogo con el título como nombre accesible", () => {
    render(<Modal title="Nuevo rol" onClose={vi.fn()}><input aria-label="Nombre" /></Modal>);

    expect(screen.getByRole("dialog", { name: "Nuevo rol" })).toBeInTheDocument();
  });

  it("enfoca el primer campo al abrirse", () => {
    render(<Modal title="Nuevo rol" onClose={vi.fn()}><input aria-label="Nombre" /></Modal>);

    expect(screen.getByLabelText("Nombre")).toHaveFocus();
  });

  it("se cierra con Escape y con el botón Cerrar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal title="Nuevo rol" onClose={onClose}><p>Contenido</p></Modal>);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
