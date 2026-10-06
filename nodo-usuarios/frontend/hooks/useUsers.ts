import { useCallback, useEffect, useState } from "react";
import * as api from "../data";
import { errorMessage } from "../errors";
import { compareByName } from "../format";
import type { NewUserDraft, User, UserUpdate } from "../types";

/** Usuarios y sus operaciones. Con `enabled` a false no se cargan (el rol no tiene `users:read`). */
export function useUsers(enabled: boolean) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    if (!enabled) {
      setUsers(null);
      return;
    }
    try {
      setUsers(await api.loadUsers());
    } catch (caught) {
      setError(errorMessage(caught, "No se pudieron cargar los usuarios."));
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createUser(draft: NewUserDraft) {
    const created = await api.createUser(draft);
    setUsers((current) => [...(current ?? []), created].sort(compareByName));
  }

  async function updateUser(userId: string, draft: UserUpdate) {
    const updated = await api.updateUser(userId, draft);
    setUsers((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? null);
  }

  async function deleteUser(userId: string) {
    await api.deleteUser(userId);
    setUsers((current) => current?.filter((item) => item.id !== userId) ?? null);
  }

  async function resendInvitation(userId: string) {
    await api.resendInvitation(userId);
  }

  return { users, error, reload, createUser, updateUser, deleteUser, resendInvitation };
}
