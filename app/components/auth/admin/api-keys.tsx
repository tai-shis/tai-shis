"use client";

import { useId, useState } from "react";
import Panel from "@/app/components/panel";
import CopyButton from "@/app/components/copy-button";

const actionClass = "px-2 py-1 text-sm text-muted hover:text-accent transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60";

export type ApiKeySummary = {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: Date;
};

/**
 * `keys` is null while loading. `onCreate` resolves to the new key's secret, or null on failure.
 * `onRevoke` resolves to true when the key was deleted.
 */
export type ApiKeysProps = {
  keys: ApiKeySummary[] | null;
  loadError: string | null;
  onCreate: (name: string) => Promise<string | null>;
  onRevoke: (keyId: string) => Promise<boolean>;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function ApiKeys({ keys, loadError, onCreate, onRevoke }: ApiKeysProps) {
  const [newSecret, setNewSecret] = useState<string | null>(null);

  return (
    <Panel name="api keys" className="p-4 flex flex-col gap-4">
      {newSecret ? (
        <NewKeyNotice secret={newSecret} onDone={() => setNewSecret(null)} />
      ) : (
        <CreateKeyForm onCreate={onCreate} onCreated={setNewSecret} />
      )}
      <KeyList keys={keys} loadError={loadError} onRevoke={onRevoke} />
    </Panel>
  );
}

function CreateKeyForm({ onCreate, onCreated }: { onCreate: ApiKeysProps["onCreate"]; onCreated: (secret: string) => void }) {
  const inputId = useId();
  const errorId = useId();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter a name for the key.");
      return;
    }
    setError(null);
    setIsCreating(true);
    const secret = await onCreate(name.trim());
    setIsCreating(false);
    if (!secret) {
      setError("Unable to create the key. Try again.");
      return;
    }
    setName("");
    onCreated(secret);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-2">
        <label htmlFor={inputId} className="text-sm text-muted shrink-0">name</label>
        <input
          id={inputId}
          name="api-key-name"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        />
        <button type="submit" disabled={isCreating} className={`${actionClass} shrink-0`}>
          [create key]
        </button>
      </div>
      {error && <p id={errorId} className="text-sm text-destructive px-2">{error}</p>}
    </form>
  );
}

function NewKeyNotice({ secret, onDone }: { secret: string; onDone: () => void }) {
  return (
    <div role="status" className="flex flex-col gap-2 px-2">
      <p className="text-sm text-foreground">Copy this key now. It won&apos;t be shown again.</p>
      <code className="text-sm text-accent break-all">{secret}</code>
      <div className="flex items-center justify-between">
        <CopyButton label="Copy key" copyText={secret} reactionText="Copied" />
        <button onClick={onDone} className={actionClass}>[done]</button>
      </div>
    </div>
  );
}

function KeyList({ keys, loadError, onRevoke }: Pick<ApiKeysProps, "keys" | "loadError" | "onRevoke">) {
  if (loadError) return <p role="alert" className="text-sm text-destructive px-2">{loadError}</p>;
  if (!keys) return <p className="text-sm text-muted px-2">Loading keys...</p>;
  if (keys.length === 0) {
    return <p className="text-sm text-muted px-2">No API keys yet. Create one to call protected endpoints from scripts.</p>;
  }

  return (
    <ul className="flex flex-col text-sm text-muted">
      {keys.map((key) => <KeyRow key={key.id} apiKey={key} onRevoke={onRevoke} />)}
    </ul>
  );
}

function KeyRow({ apiKey, onRevoke }: { apiKey: ApiKeySummary; onRevoke: ApiKeysProps["onRevoke"] }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = apiKey.name ?? "unnamed";

  const handleRevoke = async () => {
    setError(null);
    setIsRevoking(true);
    const succeeded = await onRevoke(apiKey.id);
    setIsRevoking(false);
    if (!succeeded) setError(`Unable to revoke ${label}. Try again.`);
  };

  return (
    <li className="flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="text-foreground truncate">{label}</span>
        {apiKey.start && <span className="shrink-0">{apiKey.start}...</span>}
        <span className="shrink-0">{formatDate(apiKey.createdAt)}</span>
        <span className="ml-auto flex shrink-0">
          {isConfirming ? (
            <>
              <button onClick={handleRevoke} disabled={isRevoking} className={`${actionClass} hover:text-destructive`}>
                [revoke {label}]
              </button>
              <button onClick={() => setIsConfirming(false)} disabled={isRevoking} className={actionClass}>[cancel]</button>
            </>
          ) : (
            <button onClick={() => setIsConfirming(true)} className={actionClass}>[revoke]</button>
          )}
        </span>
      </div>
      {error && <p role="alert" className="text-destructive px-2">{error}</p>}
    </li>
  );
}
