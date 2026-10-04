import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("muestra el título como encabezado principal, la descripción y la acción", () => {
    render(<PageHeader title="Usuarios" description="Gestiona el acceso." action={<button type="button">Añadir</button>} />);

    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getByText("Gestiona el acceso.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Añadir" })).toBeInTheDocument();
  });
});
