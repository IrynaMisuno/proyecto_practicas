import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

function renderDialog(onConfirm: () => Promise<void>, onClose = vi.fn()) {
  render(<ConfirmDialog title="Eliminar rol" message="No se puede deshacer." confirmLabel="Eliminar rol" onConfirm={onConfirm} onClose={onClose} />);
  return onClose;
}

describe("ConfirmDialog", () => {
  it("ejecuta la acción y se cierra al confirmar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = renderDialog(onConfirm);

    await user.click(screen.getByRole("button", { name: "Eliminar rol" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("muestra el error y sigue abierto si la acción falla", async () => {
    const user = userEvent.setup();
    const onClose = renderDialog(vi.fn().mockRejectedValue(new Error("El rol está asignado.")));

    await user.click(screen.getByRole("button", { name: "Eliminar rol" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El rol está asignado.");
    expect(onClose).not.toHaveBeenCalled();
  });
});
