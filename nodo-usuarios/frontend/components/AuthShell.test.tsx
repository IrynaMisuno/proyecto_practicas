import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthShell } from "./AuthShell";

describe("AuthShell", () => {
  it("muestra el título, el subtítulo, el contenido y el pie", () => {
    render(<AuthShell title="Inicia sesión" subtitle="Panel de administración" footer={<p>Pie</p>}><p>Formulario</p></AuthShell>);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Inicia sesión" })).toBeInTheDocument();
    expect(screen.getByText("Panel de administración")).toBeInTheDocument();
    expect(screen.getByText("Formulario")).toBeInTheDocument();
    expect(screen.getByText("Pie")).toBeInTheDocument();
  });
});
