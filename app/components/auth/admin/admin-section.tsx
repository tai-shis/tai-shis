"use client";

import { useCallback, useEffect, useState } from "react";
import UsersList, { type AdminUser, type Role } from "@/app/components/auth/admin/users-list";
import ApiKeys, { type ApiKeySummary } from "@/app/components/auth/admin/api-keys";
import { authClient } from "@/app/lib/auth-client";

const USER_LIST_LIMIT = 100;

function toAdminUser(user: { id: string; name: string; role?: string | null; createdAt: Date; country?: string | null }): AdminUser {
  return {
    id: user.id,
    username: user.name,
    country: user.country ?? null,
    role: user.role === "admin" ? "admin" : "user",
    createdAt: new Date(user.createdAt),
  };
}

function toApiKeySummary(key: { id: string; name?: string | null; start?: string | null; createdAt: Date }): ApiKeySummary {
  return { id: key.id, name: key.name ?? null, start: key.start ?? null, createdAt: new Date(key.createdAt) };
}

type LoadResult<T> = { items: T[] } | { error: string };

async function fetchUsers(): Promise<LoadResult<AdminUser>> {
  const { data, error } = await authClient.admin.listUsers({
    query: { limit: USER_LIST_LIMIT, sortBy: "createdAt", sortDirection: "desc" },
  });
  if (error || !data) return { error: "Unable to load users. Reopen the dialog to try again." };
  return { items: data.users.map(toAdminUser) };
}

async function fetchApiKeys(): Promise<LoadResult<ApiKeySummary>> {
  const { data, error } = await authClient.apiKey.list();
  if (error || !data) return { error: "Unable to load API keys. Reopen the dialog to try again." };
  return { items: data.apiKeys.map(toApiKeySummary) };
}

function useLoadedList<T>(fetchList: () => Promise<LoadResult<T>>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyResult = useCallback((result: LoadResult<T>) => {
    if ("error" in result) {
      setLoadError(result.error);
      return;
    }
    setLoadError(null);
    setItems(result.items);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    fetchList().then((result) => {
      if (isCurrent) applyResult(result);
    });
    return () => {
      isCurrent = false;
    };
  }, [fetchList, applyResult]);

  const reload = useCallback(async () => applyResult(await fetchList()), [fetchList, applyResult]);

  return { items, loadError, reload };
}

function useUsers() {
  const { items: users, loadError, reload } = useLoadedList(fetchUsers);

  const setRole = useCallback(async (userId: string, role: Role) => {
    const { error } = await authClient.admin.setRole({ userId, role });
    if (error) return false;
    await reload();
    return true;
  }, [reload]);

  return { users, loadError, setRole };
}

function useApiKeys() {
  const { items: keys, loadError, reload } = useLoadedList(fetchApiKeys);

  const createKey = useCallback(async (name: string) => {
    const { data, error } = await authClient.apiKey.create({ name });
    if (error || !data) return null;
    await reload();
    return data.key;
  }, [reload]);

  const revokeKey = useCallback(async (keyId: string) => {
    const { error } = await authClient.apiKey.delete({ keyId });
    if (error) return false;
    await reload();
    return true;
  }, [reload]);

  return { keys, loadError, createKey, revokeKey };
}

export default function AdminSection({ currentUserId }: { currentUserId: string }) {
  const users = useUsers();
  const apiKeys = useApiKeys();

  return (
    <>
      <ApiKeys keys={apiKeys.keys} loadError={apiKeys.loadError} onCreate={apiKeys.createKey} onRevoke={apiKeys.revokeKey} />
      <UsersList users={users.users} loadError={users.loadError} currentUserId={currentUserId} onSetRole={users.setRole} />
    </>
  );
}
