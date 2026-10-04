import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BackToLogin } from "./BackToLogin";

describe("BackToLogin", () => {
  it("vuelve al login al pulsarlo", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BackToLogin onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Volver a iniciar sesión" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
