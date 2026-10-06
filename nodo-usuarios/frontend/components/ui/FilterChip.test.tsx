import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterChip } from "./FilterChip";

describe("FilterChip", () => {
  it("muestra el filtro y lo quita con la cruz", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<FilterChip label="Rol: Lector" onRemove={onRemove} />);

    expect(screen.getByText("Rol: Lector")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar filtro Rol: Lector" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });
});
