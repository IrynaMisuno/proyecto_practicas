import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleBadge } from "./RoleBadge";

describe("RoleBadge", () => {
  it("muestra el nombre del rol", () => {
    render(<RoleBadge name="Administrador" tone="indigo" />);

    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });
});
