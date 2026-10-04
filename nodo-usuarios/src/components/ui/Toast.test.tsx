import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toast } from "./Toast";

describe("Toast", () => {
  it("no muestra nada sin mensaje", () => {
    const { container } = render(<Toast message="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("anuncia el mensaje como estado", () => {
    render(<Toast message="Usuario creado." />);

    expect(screen.getByRole("status")).toHaveTextContent("Usuario creado.");
  });
});
