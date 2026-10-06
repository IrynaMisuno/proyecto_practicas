import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { useRoles } from "../hooks/useRoles";
import { useUsers } from "../hooks/useUsers";
import { ApiError } from "../errors";
import { authValue, currentAdmin, luis, permissions, roles, users } from "../test-utils/fixtures";
import { Dashboard } from "./Dashboard";

vi.mock("../hooks/useAuth");
vi.mock("../hooks/useUsers");
vi.mock("../hooks/useRoles");
vi.mock("../hooks/usePermissions");

function mockUsers(state: Partial<ReturnType<typeof useUsers>> = {}) {
  const hook = { users, error: "", reload: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn().mockResolvedValue(undefined), resendInvitation: vi.fn().mockResolvedValue(undefined), ...state };
  vi.mocked(useUsers).mockReturnValue(hook);
  return hook;
}

const reloadRoles = vi.fn();
const reloadPermissions = vi.fn();

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue(authValue());
  vi.mocked(useRoles).mockReturnValue({ roles, error: "", reload: reloadRoles, createRole: vi.fn(), updateRole: vi.fn(), deleteRole: vi.fn() });
  vi.mocked(usePermissions).mockReturnValue({ permissions, error: "", reload: reloadPermissions });
});

describe("Dashboard", () => {
  it("abre la sección de usuarios con la lista cargada", () => {
    mockUsers();
    render(<Dashboard currentUser={currentAdmin} />);

    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getByText("Mostrando 3 de 3")).toBeInTheDocument();
  });

  it("avisa si el rol no puede ver ninguna sección", () => {
    mockUsers({ users: null });
    vi.mocked(useAuth).mockReturnValue(authValue({ can: () => false }));
    render(<Dashboard currentUser={currentAdmin} />);

    expect(screen.getByText(/Tu rol no tiene permisos para ver ninguna sección/)).toBeInTheDocument();
  });

  it("muestra el error de carga y permite reintentar", async () => {
    const user = userEvent.setup();
    const hook = mockUsers({ users: null, error: "No se pudieron cargar los usuarios." });
    render(<Dashboard currentUser={currentAdmin} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar los usuarios.");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(hook.reload).toHaveBeenCalledOnce();
    expect(reloadRoles).toHaveBeenCalledOnce();
    expect(reloadPermissions).toHaveBeenCalledOnce();
  });

  it("elimina un usuario tras confirmarlo y lo anuncia", async () => {
    const user = userEvent.setup();
    const hook = mockUsers();
    render(<Dashboard currentUser={currentAdmin} />);

    await user.click(screen.getByRole("button", { name: "Eliminar a Luis Gómez" }));
    const dialog = screen.getByRole("dialog", { name: "Eliminar usuario" });
    await user.click(within(dialog).getByRole("button", { name: "Eliminar usuario" }));

    expect(hook.deleteUser).toHaveBeenCalledWith(luis.id);
    expect(await screen.findByRole("status")).toHaveTextContent("Usuario eliminado.");
  });

  it("invita a un usuario nuevo y lo anuncia", async () => {
    const user = userEvent.setup();
    const hook = mockUsers({ createUser: vi.fn().mockResolvedValue(undefined) });
    render(<Dashboard currentUser={currentAdmin} />);

    await user.click(screen.getByRole("button", { name: "Añadir usuario" }));
    await user.type(screen.getByLabelText("Nombre completo"), "Marta Díaz");
    await user.type(screen.getByLabelText("Email"), "marta@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar invitación" }));

    expect(hook.createUser).toHaveBeenCalledWith({ name: "Marta Díaz", email: "marta@example.com", role_id: roles[0].id });
    expect(await screen.findByRole("status")).toHaveTextContent("Invitación enviada a marta@example.com.");
  });

  it("reenvía la invitación y lo anuncia", async () => {
    const user = userEvent.setup();
    const hook = mockUsers();
    render(<Dashboard currentUser={currentAdmin} />);

    await user.click(screen.getByRole("button", { name: "Reenviar invitación a Luis Gómez" }));

    expect(hook.resendInvitation).toHaveBeenCalledWith(luis.id);
    expect(await screen.findByRole("status")).toHaveTextContent("Invitación reenviada a Luis Gómez.");
  });

  it("anuncia si no se pudo reenviar la invitación", async () => {
    const user = userEvent.setup();
    mockUsers({ resendInvitation: vi.fn().mockRejectedValue(new ApiError("Solo se puede reenviar la invitación a usuarios invitados.", 409)) });
    render(<Dashboard currentUser={currentAdmin} />);

    await user.click(screen.getByRole("button", { name: "Reenviar invitación a Luis Gómez" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Solo se puede reenviar la invitación a usuarios invitados.");
  });
});
