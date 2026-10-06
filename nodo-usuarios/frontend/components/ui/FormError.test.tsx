import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormError } from "./FormError";

describe("FormError", () => {
  it("no muestra nada sin mensaje", () => {
    const { container } = render(<FormError message="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el mensaje como alerta", () => {
    render(<FormError message="No se pudo guardar." />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar.");
  });
});
