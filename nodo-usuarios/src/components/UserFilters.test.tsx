import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { roles } from "../test/fixtures";
import { UserFilters, type UserFilterValues } from "./UserFilters";

const values: UserFilterValues = { query: "", roleId: "all", status: "all" };

describe("UserFilters", () => {
  it("avisa del texto buscado", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UserFilters values={values} roles={roles} onChange={onChange} />);

    await user.type(screen.getByLabelText("Buscar usuarios"), "a");

    expect(onChange).toHaveBeenLastCalledWith({ ...values, query: "a" });
  });

  it("avisa del rol y el estado elegidos", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UserFilters values={values} roles={roles} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Filtrar por rol"), "Lector");
    expect(onChange).toHaveBeenLastCalledWith({ ...values, roleId: "rol-lector" });

    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "Suspendido");
    expect(onChange).toHaveBeenLastCalledWith({ ...values, status: "suspended" });
  });
});
