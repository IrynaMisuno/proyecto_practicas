import { useCallback, useEffect, useState } from "react";
import * as api from "../data";
import { errorMessage } from "../errors";
import { compareByName } from "../format";
import type { Role, RoleDraft } from "../types";

/** Roles y sus operaciones. */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setRoles(await api.loadRoles());
    } catch (caught) {
      setError(errorMessage(caught, "No se pudieron cargar los roles."));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createRole(draft: RoleDraft) {
    const created = await api.createRole(draft);
    setRoles((current) => [...current, created].sort(compareByName));
  }

  async function updateRole(roleId: string, draft: Partial<RoleDraft>) {
    const updated = await api.updateRole(roleId, draft);
    setRoles((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  async function deleteRole(roleId: string) {
    await api.deleteRole(roleId);
    setRoles((current) => current.filter((item) => item.id !== roleId));
  }

  return { roles, error, reload, createRole, updateRole, deleteRole };
}
