import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("muestra la marca como elemento decorativo", () => {
    render(<Logo size="lg" />);

    expect(screen.getByText("N")).toHaveAttribute("aria-hidden", "true");
  });
});
