import { useCallback, useEffect, useState } from "react";
import * as api from "../data";
import { errorMessage } from "../errors";
import type { PermissionInfo } from "../types";

/** Catálogo de permisos con sus nombres en español. */
export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setPermissions(await api.loadPermissions());
    } catch (caught) {
      setError(errorMessage(caught, "No se pudieron cargar los permisos."));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { permissions, error, reload };
}
