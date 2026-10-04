import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("muestra las iniciales de las dos primeras palabras", () => {
    render(<Avatar name="Ana María Pérez" />);

    expect(screen.getByText("AM")).toBeInTheDocument();
  });

  it("se oculta a los lectores de pantalla porque el nombre ya aparece al lado", () => {
    render(<Avatar name="Ana Pérez" />);

    expect(screen.getByText("AP")).toHaveAttribute("aria-hidden", "true");
  });
});
