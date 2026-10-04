import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isStrongPassword, PasswordChecklist } from "./PasswordChecklist";

// describe agrupa los tests de un mismo componente; cada it es un caso.
describe("PasswordChecklist", () => {
  // Busca la lista por su nombre accesible, como lo haría un lector de pantalla.
  const getLista = () => screen.getByRole("list", { name: "Requisitos de la contraseña" });

  it("marca todos los requisitos como pendientes si la contraseña está vacía", () => {
    render(<PasswordChecklist password="" />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(getLista()).not.toHaveTextContent("cumplido");
  });

  it("marca solo los requisitos que se cumplen", () => {
    render(<PasswordChecklist password="abc" />);

    expect(getLista()).toHaveTextContent("Una minúscula: cumplido");
    expect(getLista()).toHaveTextContent("Una mayúscula: pendiente");
    expect(getLista()).toHaveTextContent("Al menos 10 caracteres: pendiente");
  });

  it("marca todos los requisitos como cumplidos con una contraseña válida", () => {
    render(<PasswordChecklist password="Segura-2026x" />);

    expect(getLista()).not.toHaveTextContent("pendiente");
  });
});

describe("isStrongPassword", () => {
  it("acepta una contraseña que cumple la política", () => {
    expect(isStrongPassword("Segura-2026x")).toBe(true);
  });

  it("rechaza una contraseña a la que le falta el símbolo", () => {
    expect(isStrongPassword("Segura2026xx")).toBe(false);
  });
});
