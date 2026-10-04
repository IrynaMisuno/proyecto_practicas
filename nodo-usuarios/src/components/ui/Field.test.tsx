import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";

describe("Field", () => {
  it("asocia la etiqueta al campo", () => {
    render(<Field label="Email"><input /></Field>);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("muestra el error como alerta en lugar de la ayuda", () => {
    render(<Field label="Email" error="El email no es válido." hint="Ayuda"><input /></Field>);

    expect(screen.getByRole("alert")).toHaveTextContent("El email no es válido.");
    expect(screen.queryByText("Ayuda")).not.toBeInTheDocument();
  });

  it("muestra la ayuda si no hay error", () => {
    render(<Field label="Email" hint="Usa tu email de trabajo"><input /></Field>);

    expect(screen.getByText("Usa tu email de trabajo")).toBeInTheDocument();
  });
});
