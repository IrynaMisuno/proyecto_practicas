import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { users } from "../test/fixtures";
import { UserStats } from "./UserStats";

describe("UserStats", () => {
  it("cuenta los usuarios por estado", () => {
    render(<UserStats users={users} />);

    // Cada dato es un par término (dt) + valor (dd).
    const stat = (label: string) => screen.getByText(label).parentElement;
    expect(stat("Usuarios")).toHaveTextContent("3");
    expect(stat("Activos")).toHaveTextContent("1");
    expect(stat("Invitados")).toHaveTextContent("1");
    expect(stat("Suspendidos")).toHaveTextContent("1");
  });
});
