"use client";

import { useEffect, useRef } from "react";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";
import ChatInput from "@/app/components/chat/chat-input";
import type { ChatStatus } from "@/app/components/chat/chat-view";
import {
  MAX_INGESTION_MESSAGE_CHARS,
  MAX_PDF_TEXT_CHARS,
  type PdfAttachment,
  type PendingChange,
  type PendingChangeStatus,
} from "@/app/lib/ingestion/types";

/**
 * One line of an AI step: a tool it ran, such as reading a table or proposing a change.
 * A finished proposal carries its `pendingChangeId`, so its line can show how Tai reviewed it.
 */
export type IngestionStep = {
  id: string;
  label: string;
  state: "running" | "done" | "failed";
  detail?: string;
  pendingChangeId?: string;
};

export type IngestionBlock =
  | { kind: "text"; text: string }
  | { kind: "step"; step: IngestionStep }
  | { kind: "pdf"; filename: string; pages: number; truncated: boolean };

/** The PDF picked for the next message, which is read on the server before it can be sent. */
export type PdfUploadState =
  | { status: "none" }
  | { status: "reading"; filename: string }
  | { status: "ready"; pdf: PdfAttachment }
  | { status: "failed"; error: string };

export type IngestionEntry = { id: string; role: "user" | "assistant"; blocks: IngestionBlock[] };

export type IngestionChatViewProps = {
  messages: IngestionEntry[];
  status: ChatStatus;
  error: string | null;
  canRetry: boolean;
  /** The session's proposals, reviewed or not. Any still pending lock the chat until reviewed below it. */
  changes: PendingChange[];
  isLoadingChanges: boolean;
  upload: PdfUploadState;
  onAttach: (file: File) => void;
  onRemoveAttachment: () => void;
  /** Starts grill mode: the AI interviews Tai to fill gaps in the profile. */
  onGrill: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onNewSession: () => void;
};

const STEP_MARKER: Record<IngestionStep["state"], string> = { running: "…", done: "✓", failed: "✗" };

export default function IngestionChatView({
  messages,
  status,
  error,
  canRetry,
  changes,
  isLoadingChanges,
  upload,
  onAttach,
  onRemoveAttachment,
  onGrill,
  onSend,
  onStop,
  onRetry,
  onNewSession,
}: IngestionChatViewProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";
  const isWaiting = isBusy && messages.at(-1)?.role === "user";
  const toReview = changes.filter((change) => change.status === "pending").length;
  const isLocked = isBusy || isLoadingChanges || toReview > 0;
  const reviewById = new Map(changes.map((change) => [change.id, change.status]));

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, status]);

  return (
    <Panel name="ingest" className="h-[36rem] max-h-[75vh] flex flex-col gap-3 p-4">
      <div
        ref={logRef}
        role="log"
        aria-label="Ingestion conversation"
        aria-busy={isBusy || undefined}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-3 px-2 text-sm"
      >
        {messages.length === 0 && (
          <p className="text-muted">
            Paste a resume section, a project write-up, or a cover letter, attach a PDF, or just tell me about
            yourself. I&apos;ll propose profile changes for you to review below. Or press [grill me] and I&apos;ll
            interview you to fill the gaps.
          </p>
        )}
        {messages.map((message, i) => (
          <IngestionMessage
            key={message.id}
            message={isBusy && i === messages.length - 1 ? message : markUnfinishedSteps(message)}
            reviewById={reviewById}
          />
        ))}
        {isWaiting && <p className="text-muted">ai › ...</p>}
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          {canRetry && <button type="button" onClick={onRetry} className={actionClass}>[retry]</button>}
        </div>
      )}

      <UploadStatus upload={upload} onRemove={onRemoveAttachment} />
      {!isBusy && toReview > 0 && (
        <p role="status" className="px-2 text-xs text-accent">
          Review the {toReview === 1 ? "proposal" : `${toReview} proposals`} below to continue.
        </p>
      )}

      <ChatInput
        isBusy={isBusy}
        maxLength={MAX_INGESTION_MESSAGE_CHARS}
        placeholder={upload.status === "ready" ? "Add a note, or just send" : "Paste or type something about yourself"}
        rows={4}
        allowEmpty={upload.status === "ready"}
        inputDisabled={isLocked}
        sendDisabled={isLocked || upload.status === "reading"}
        accessory={
          <>
            <AttachButton disabled={isLocked || upload.status === "reading"} onAttach={onAttach} />
            {/* A picked PDF would be dropped, so grilling waits until it's sent or removed. */}
            <button type="button" onClick={onGrill} disabled={isLocked || upload.status !== "none"} className={`${actionClass} text-xs`}>
              [grill me]
            </button>
          </>
        }
        onSend={onSend}
        onStop={onStop}
      />

      <div className="flex items-center px-2 text-xs text-muted">
        <p>Nothing is saved until you approve it.</p>
        {messages.length > 0 && (
          <button type="button" onClick={onNewSession} disabled={isBusy} className={`${actionClass} ml-auto text-xs`}>
            [new session]
          </button>
        )}
      </div>
    </Panel>
  );
}

function describePdf(pages: number, filename: string): string {
  return `${filename} · ${pages} page${pages === 1 ? "" : "s"}`;
}

function UploadStatus({ upload, onRemove }: { upload: PdfUploadState; onRemove: () => void }) {
  if (upload.status === "none") return null;
  if (upload.status === "reading") {
    return <p role="status" className="px-2 text-xs text-muted">reading {upload.filename}...</p>;
  }

  const remove = (
    <button type="button" onClick={onRemove} className={`${actionClass} text-xs`}>
      [remove]
    </button>
  );
  if (upload.status === "failed") {
    return (
      <div className="flex flex-wrap items-center gap-2 px-2">
        <p role="alert" className="text-xs text-destructive">{upload.error}</p>
        {remove}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 px-2 text-xs">
      <p className="min-w-0 break-words">
        <span className="text-accent">[pdf]</span> {describePdf(upload.pdf.pages, upload.pdf.filename)}
        {upload.pdf.truncated && (
          <span className="text-muted"> · only the first {MAX_PDF_TEXT_CHARS.toLocaleString("en-US")} characters will be sent</span>
        )}
      </p>
      {remove}
    </div>
  );
}

function AttachButton({ disabled, onAttach }: { disabled: boolean; onAttach: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Cleared so picking the same file again still fires a change.
          e.target.value = "";
          if (file) onAttach(file);
        }}
      />
      <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className={`${actionClass} text-xs`}>
        [attach pdf]
      </button>
    </>
  );
}

type IngestionMessageProps = {
  message: IngestionEntry;
  reviewById: Map<string, PendingChangeStatus>;
};

function IngestionMessage({ message, reviewById }: IngestionMessageProps) {
  const isUser = message.role === "user";
  return (
    <div className="flex flex-col gap-1">
      {message.blocks.map((block, i) =>
        block.kind === "pdf" ? (
          <p key={i} className="break-words">
            <span className="text-accent">
              you<span aria-hidden="true"> ›</span>
            </span>{" "}
            <span className="text-muted">
              [pdf] {describePdf(block.pages, block.filename)}
              {block.truncated && " · text cut off"}
            </span>
          </p>
        ) : block.kind === "text" ? (
          <p key={i} className="whitespace-pre-wrap break-words">
            <span className={isUser ? "text-accent" : "text-border-accent"}>
              {isUser ? "you" : "ai"}
              <span aria-hidden="true"> ›</span>
            </span>{" "}
            <span className={isUser ? "text-muted" : "text-foreground"}>{block.text}</span>
          </p>
        ) : (
          <StepLine
            key={block.step.id}
            step={block.step}
            review={block.step.pendingChangeId ? reviewById.get(block.step.pendingChangeId) : undefined}
          />
        ),
      )}
    </div>
  );
}

/** A step still running once its reply has ended was cut off, so it shows as failed rather than forever in progress. */
function markUnfinishedSteps(message: IngestionEntry): IngestionEntry {
  return {
    ...message,
    blocks: message.blocks.map((block) =>
      block.kind === "step" && block.step.state === "running"
        ? { kind: "step", step: { ...block.step, state: "failed", detail: "didn't finish" } }
        : block,
    ),
  };
}

const REVIEW_LABEL: Record<PendingChangeStatus, string> = {
  pending: "waiting for review",
  approved: "approved",
  rejected: "rejected",
};

function StepLine({ step, review }: { step: IngestionStep; review?: PendingChangeStatus }) {
  return (
    <p className={`pl-4 text-xs break-words ${step.state === "failed" ? "text-destructive" : "text-muted"}`}>
      <span aria-hidden="true">{STEP_MARKER[step.state]} </span>
      {step.label}
      {step.detail && <span>: {step.detail}</span>}
      {review && <span className={review === "pending" ? "text-accent" : undefined}> · {REVIEW_LABEL[review]}</span>}
    </p>
  );
}
