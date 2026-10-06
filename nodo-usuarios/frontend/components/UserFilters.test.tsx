import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { roles } from "../test-utils/fixtures";
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

  it("no muestra filtros aplicados si no hay ninguno", () => {
    render(<UserFilters values={values} roles={roles} onChange={vi.fn()} />);

    expect(screen.queryByRole("list", { name: "Filtros aplicados" })).not.toBeInTheDocument();
  });

  it("muestra cada filtro aplicado", () => {
    render(<UserFilters values={{ query: " ana ", roleId: "rol-lector", status: "invited" }} roles={roles} onChange={vi.fn()} />);

    const applied = within(screen.getByRole("list", { name: "Filtros aplicados" }));
    expect(applied.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Búsqueda: «ana»", "Rol: Lector", "Estado: Invitado"]);
  });

  it.each([
    ["Búsqueda: «ana»", { query: "" }, "Buscar usuarios"],
    ["Rol: Lector", { roleId: "all" }, "Filtrar por rol"],
    ["Estado: Invitado", { status: "all" }, "Filtrar por estado"],
  ])("quita el filtro %s con su cruz y lleva el foco a su campo", async (label, reset, field) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const applied: UserFilterValues = { query: "ana", roleId: "rol-lector", status: "invited" };
    render(<UserFilters values={applied} roles={roles} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: `Quitar filtro ${label}` }));

    expect(onChange).toHaveBeenLastCalledWith({ ...applied, ...reset });
    expect(screen.getByLabelText(field)).toHaveFocus();
  });
});
