"use client";

import { useEffect, useRef } from "react";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";
import ChatInput from "@/app/components/chat/chat-input";
import type { ChatStatus } from "@/app/components/chat/chat-view";
import { MAX_INGESTION_MESSAGE_CHARS } from "@/app/lib/ingestion/types";

/** One line of an AI step: a tool it ran, such as reading a table or proposing a change. */
export type IngestionStep = { id: string; label: string; state: "running" | "done" | "failed"; detail?: string };

export type IngestionBlock = { kind: "text"; text: string } | { kind: "step"; step: IngestionStep };

export type IngestionEntry = { id: string; role: "user" | "assistant"; blocks: IngestionBlock[] };

export type IngestionChatViewProps = {
  messages: IngestionEntry[];
  status: ChatStatus;
  error: string | null;
  canRetry: boolean;
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
  onSend,
  onStop,
  onRetry,
  onNewSession,
}: IngestionChatViewProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";
  const isWaiting = isBusy && messages.at(-1)?.role === "user";

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
            Paste a resume section, a project write-up, or a cover letter, or just tell me about yourself. I&apos;ll
            propose profile changes for you to review below.
          </p>
        )}
        {messages.map((message) => (
          <IngestionMessage key={message.id} message={message} />
        ))}
        {isWaiting && <p className="text-muted">ai › ...</p>}
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          {canRetry && <button type="button" onClick={onRetry} className={actionClass}>[retry]</button>}
        </div>
      )}

      <ChatInput
        isBusy={isBusy}
        maxLength={MAX_INGESTION_MESSAGE_CHARS}
        placeholder="Paste or type something about yourself"
        rows={4}
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

function IngestionMessage({ message }: { message: IngestionEntry }) {
  const isUser = message.role === "user";
  return (
    <div className="flex flex-col gap-1">
      {message.blocks.map((block, i) =>
        block.kind === "text" ? (
          <p key={i} className="whitespace-pre-wrap break-words">
            <span className={isUser ? "text-accent" : "text-border-accent"}>
              {isUser ? "you" : "ai"}
              <span aria-hidden="true"> ›</span>
            </span>{" "}
            <span className={isUser ? "text-muted" : "text-foreground"}>{block.text}</span>
          </p>
        ) : (
          <StepLine key={block.step.id} step={block.step} />
        ),
      )}
    </div>
  );
}

function StepLine({ step }: { step: IngestionStep }) {
  return (
    <p className={`pl-4 text-xs break-words ${step.state === "failed" ? "text-destructive" : "text-muted"}`}>
      <span aria-hidden="true">{STEP_MARKER[step.state]} </span>
      {step.label}
      {step.detail && <span>: {step.detail}</span>}
    </p>
  );
}
