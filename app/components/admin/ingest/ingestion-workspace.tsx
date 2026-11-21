"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";
import RowActionLabel from "@/app/components/admin/row-action-label";
import IngestionChatView, { type PdfUploadState } from "@/app/components/admin/ingest/ingestion-chat-view";
import PendingChangeList from "@/app/components/admin/ingest/pending-change-list";
import { toIngestionEntry } from "@/app/components/admin/ingest/to-ingestion-entry";
import type { LoadChangesResult, LoadSessionResult } from "@/app/lib/ingestion/actions";
import {
  MAX_PDF_BYTES,
  type IngestionSessionSummary,
  type IngestionUIMessage,
  type PdfAttachment,
  type PendingChange,
  type PendingChangeActions,
} from "@/app/lib/ingestion/types";
import type { ProfileFormValues, ProfileMutationResult } from "@/app/lib/profile/tables";

export type IngestionWorkspaceProps = {
  sessions: IngestionSessionSummary[];
  loadSession: (id: string) => Promise<LoadSessionResult>;
  loadChanges: (sessionId: string) => Promise<LoadChangesResult>;
  actions: PendingChangeActions;
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

const PDF_TOO_LARGE = `PDFs can be up to ${MAX_PDF_BYTES / 1024 / 1024} MB.`;
const PDF_FAILED = "That PDF couldn't be read. Try again.";

/** Reads a PDF's text on the server. Resolves to the text, or a message for Tai. */
async function readPdf(file: File): Promise<{ ok: true; pdf: PdfAttachment } | { ok: false; error: string }> {
  if (file.size > MAX_PDF_BYTES) return { ok: false, error: PDF_TOO_LARGE };
  const body = new FormData();
  body.append("file", file);
  try {
    const response = await fetch("/api/admin/ingest/pdf", { method: "POST", body });
    if (response.ok) return { ok: true, pdf: (await response.json()) as PdfAttachment };
    // The server explains 4xx failures; anything else gets the generic message.
    const message = response.status < 500 ? await response.text() : "";
    return { ok: false, error: message || PDF_FAILED };
  } catch {
    return { ok: false, error: PDF_FAILED };
  }
}

type OpenSession = { id: string; initialMessages: IngestionUIMessage[]; initialChanges: PendingChange[] };

const newSession = (): OpenSession => ({ id: crypto.randomUUID(), initialMessages: [], initialChanges: [] });

export default function IngestionWorkspace({ sessions, loadSession, loadChanges, actions }: IngestionWorkspaceProps) {
  const [openSession, setOpenSession] = useState<OpenSession>(newSession);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleOpen = async (id: string) => {
    setLoadError(null);
    setLoadingId(id);
    const result = await loadSession(id);
    setLoadingId(null);
    if (result.ok) setOpenSession({ id, initialMessages: result.messages, initialChanges: result.changes });
    else setLoadError(result.error);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <IngestionChat
        key={openSession.id}
        session={openSession}
        loadChanges={loadChanges}
        actions={actions}
        onNewSession={() => setOpenSession(newSession())}
      />
      <Panel name="sessions" className="p-4 flex flex-col gap-2">
        {sessions.length === 0 ? (
          <p className="px-2 text-sm text-muted">Past sessions show up here.</p>
        ) : (
          <ul className="flex flex-col text-sm">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-2 px-2">
                <span className="min-w-0 truncate">{session.title}</span>
                <span className="shrink-0 text-xs text-muted">{session.createdAt.slice(0, 10)}</span>
                {session.toReview > 0 && <span className="shrink-0 text-xs text-accent">({session.toReview} to review)</span>}
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
  session: OpenSession;
  loadChanges: (sessionId: string) => Promise<LoadChangesResult>;
  actions: PendingChangeActions;
  onNewSession: () => void;
};

function IngestionChat({ session, loadChanges, actions, onNewSession }: IngestionChatProps) {
  const router = useRouter();
  const [changes, setChanges] = useState<PendingChange[]>(session.initialChanges);
  const [isLoadingChanges, setIsLoadingChanges] = useState(false);
  const [changesError, setChangesError] = useState<string | null>(null);

  const syncChanges = async () => {
    setIsLoadingChanges(true);
    const result = await loadChanges(session.id);
    setIsLoadingChanges(false);
    if (result.ok) {
      setChanges(result.changes);
      setChangesError(null);
    } else {
      setChangesError(result.error);
    }
  };

  const { messages, sendMessage, status, error, stop, regenerate } = useChat<IngestionUIMessage>({
    id: session.id,
    messages: session.initialMessages,
    transport,
    onFinish: async () => {
      // The reply's proposals are saved on the server, so load them before unlocking the chat.
      await syncChanges();
      router.refresh();
    },
  });
  const errorState = describeError(error);

  const review = async (id: string, status: "approved" | "rejected", run: () => Promise<ProfileMutationResult>) => {
    const result = await run();
    if (result.ok) setChanges((current) => current.map((change) => (change.id === id ? { ...change, status } : change)));
    // Field errors belong to the edit form. Anything else may mean it was reviewed elsewhere, so reload.
    else if (!result.fieldErrors) await syncChanges();
    return result;
  };

  const reviewActions: PendingChangeActions = {
    approve: (id: string, values?: ProfileFormValues) => review(id, "approved", () => actions.approve(id, values)),
    reject: (id: string) => review(id, "rejected", () => actions.reject(id)),
    // Bulk results can be partial, so reload either way to show exactly what the server has.
    approveAll: async (ids: string[]) => {
      const result = await actions.approveAll(ids);
      await syncChanges();
      return result;
    },
    rejectAll: async (ids: string[]) => {
      const result = await actions.rejectAll(ids);
      await syncChanges();
      return result;
    },
  };

  const [upload, setUpload] = useState<PdfUploadState>({ status: "none" });
  // Only the latest pick counts, so removing or replacing a PDF mid-read drops the old result.
  const uploadIdRef = useRef(0);

  const handleAttach = async (file: File) => {
    const uploadId = ++uploadIdRef.current;
    setUpload({ status: "reading", filename: file.name });
    const result = await readPdf(file);
    if (uploadId !== uploadIdRef.current) return;
    setUpload(result.ok ? { status: "ready", pdf: result.pdf } : { status: "failed", error: result.error });
  };

  const handleRemove = () => {
    uploadIdRef.current++;
    setUpload({ status: "none" });
  };

  const handleSend = (text: string) => {
    if (upload.status === "ready") {
      const note = text ? [{ type: "text" as const, text }] : [];
      sendMessage({ parts: [{ type: "data-pdf", data: upload.pdf }, ...note] });
    } else {
      sendMessage({ text });
    }
    handleRemove();
  };

  return (
    <>
      <IngestionChatView
        messages={messages.map(toIngestionEntry)}
        status={status}
        error={errorState?.message ?? changesError}
        canRetry={errorState?.canRetry ?? false}
        changes={changes}
        isLoadingChanges={isLoadingChanges}
        upload={upload}
        onAttach={handleAttach}
        onRemoveAttachment={handleRemove}
        onSend={handleSend}
        onStop={stop}
        onRetry={() => regenerate()}
        onNewSession={onNewSession}
      />
      {/* Only this session's proposals: they're what keep the chat locked. */}
      <PendingChangeList changes={changes.filter((change) => change.status === "pending")} actions={reviewActions} />
    </>
  );
}
