"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";
import RowActionLabel from "@/app/components/admin/row-action-label";
import IngestionChatView from "@/app/components/admin/ingest/ingestion-chat-view";
import { toIngestionEntry } from "@/app/components/admin/ingest/to-ingestion-entry";
import type { IngestionSessionSummary, IngestionUIMessage } from "@/app/lib/ingestion/types";

type LoadSessionResult = { ok: true; messages: IngestionUIMessage[] } | { ok: false; error: string };

/** `children` renders between the chat and the session list. */
export type IngestionWorkspaceProps = {
  sessions: IngestionSessionSummary[];
  loadSession: (id: string) => Promise<LoadSessionResult>;
  children?: React.ReactNode;
};

const transport = new DefaultChatTransport<IngestionUIMessage>({ api: "/api/admin/ingest" });

// The server answers these with a message for Tai, and retrying won't change it.
const FINAL_ERROR_STATUSES = new Set([400, 404, 503]);
const GENERIC_ERROR = "Something went wrong. Try again.";

function describeError(error: Error | undefined): { message: string; canRetry: boolean } | null {
  if (!error) return null;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number" && FINAL_ERROR_STATUSES.has(statusCode)) {
    return { message: error.message, canRetry: false };
  }
  return { message: GENERIC_ERROR, canRetry: true };
}

type OpenSession = { id: string; initialMessages: IngestionUIMessage[] };

export default function IngestionWorkspace({ sessions, loadSession, children }: IngestionWorkspaceProps) {
  const [openSession, setOpenSession] = useState<OpenSession>(() => ({ id: crypto.randomUUID(), initialMessages: [] }));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleOpen = async (id: string) => {
    setLoadError(null);
    setLoadingId(id);
    const result = await loadSession(id);
    setLoadingId(null);
    if (result.ok) setOpenSession({ id, initialMessages: result.messages });
    else setLoadError(result.error);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <IngestionChat
        key={openSession.id}
        sessionId={openSession.id}
        initialMessages={openSession.initialMessages}
        onNewSession={() => setOpenSession({ id: crypto.randomUUID(), initialMessages: [] })}
      />
      {children}
      <Panel name="sessions" className="p-4 flex flex-col gap-2">
        {sessions.length === 0 ? (
          <p className="px-2 text-sm text-muted">Past sessions show up here.</p>
        ) : (
          <ul className="flex flex-col text-sm">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-2 px-2">
                <span className="min-w-0 truncate">{session.title}</span>
                <span className="shrink-0 text-xs text-muted">{session.createdAt.slice(0, 10)}</span>
                <span className="ml-auto shrink-0">
                  {session.id === openSession.id ? (
                    <span className="px-2 text-xs text-muted">(open)</span>
                  ) : (
                    <button onClick={() => handleOpen(session.id)} disabled={loadingId !== null} className={actionClass}>
                      <RowActionLabel action={loadingId === session.id ? "opening..." : "open"} rowTitle={session.title} />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {loadError && <p role="alert" className="px-2 text-sm text-destructive">{loadError}</p>}
      </Panel>
    </div>
  );
}

type IngestionChatProps = {
  sessionId: string;
  initialMessages: IngestionUIMessage[];
  onNewSession: () => void;
};

function IngestionChat({ sessionId, initialMessages, onNewSession }: IngestionChatProps) {
  const router = useRouter();
  const { messages, sendMessage, status, error, stop, regenerate } = useChat<IngestionUIMessage>({
    id: sessionId,
    messages: initialMessages,
    transport,
    // New proposals and the session list come from the server, so reload them after each reply.
    onFinish: () => router.refresh(),
  });
  const errorState = describeError(error);

  return (
    <IngestionChatView
      messages={messages.map(toIngestionEntry)}
      status={status}
      error={errorState?.message ?? null}
      canRetry={errorState?.canRetry ?? false}
      onSend={(text) => sendMessage({ text })}
      onStop={stop}
      onRetry={() => regenerate()}
      onNewSession={onNewSession}
    />
  );
}
