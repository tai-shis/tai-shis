"use client";

import { useState } from "react";
import Panel from "@/app/components/panel";

const actionClass = "px-2 py-1 text-sm text-muted hover:text-accent transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60";

export type Role = "admin" | "user";

export type AdminUser = {
  id: string;
  username: string;
  country: string | null;
  role: Role;
  createdAt: Date;
};

/** `users` is null while loading. `onSetRole` resolves to true when the change succeeded. */
export type UsersListProps = {
  users: AdminUser[] | null;
  loadError: string | null;
  currentUserId: string;
  onSetRole: (userId: string, role: Role) => Promise<boolean>;
};

export default function UsersList({ users, loadError, currentUserId, onSetRole }: UsersListProps) {
  return (
    <Panel name="users" className="p-4">
      <UsersListBody users={users} loadError={loadError} currentUserId={currentUserId} onSetRole={onSetRole} />
    </Panel>
  );
}

function UsersListBody({ users, loadError, currentUserId, onSetRole }: UsersListProps) {
  if (loadError) return <p role="alert" className="text-sm text-destructive px-2">{loadError}</p>;
  if (!users) return <p className="text-sm text-muted px-2">Loading users...</p>;
  if (users.length === 0) return <p className="text-sm text-muted px-2">No users yet.</p>;

  return (
    <table className="w-full text-sm text-muted">
      <thead>
        <tr className="text-left">
          <th scope="col" className="px-2 py-1 font-normal">user</th>
          <th scope="col" className="px-2 py-1 font-normal">country</th>
          <th scope="col" className="px-2 py-1 font-normal">role</th>
          <th scope="col" className="px-2 py-1 font-normal sr-only">actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} isCurrentUser={user.id === currentUserId} onSetRole={onSetRole} />
        ))}
      </tbody>
    </table>
  );
}

function UserRow({ user, isCurrentUser, onSetRole }: { user: AdminUser; isCurrentUser: boolean; onSetRole: UsersListProps["onSetRole"] }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextRole: Role = user.role === "admin" ? "user" : "admin";

  const handleToggleRole = async () => {
    setError(null);
    setIsSaving(true);
    const succeeded = await onSetRole(user.id, nextRole);
    setIsSaving(false);
    if (!succeeded) setError(`Unable to change @${user.username}'s role. Try again.`);
  };

  return (
    <>
      <tr>
        <td className="px-2 py-1 max-w-40 truncate">@{user.username}</td>
        <td className="px-2 py-1">{user.country ?? "n/a"}</td>
        <td className="px-2 py-1">{user.role}</td>
        <td className="px-2 py-1 text-right">
          {isCurrentUser ? (
            <span>(you)</span>
          ) : (
            <button onClick={handleToggleRole} disabled={isSaving} className={actionClass}>
              [{nextRole === "admin" ? "make admin" : "remove admin"}]
            </button>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={4} role="alert" className="px-2 py-1 text-destructive">{error}</td>
        </tr>
      )}
    </>
  );
}
