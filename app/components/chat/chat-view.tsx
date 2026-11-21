"use client";

import { useEffect, useRef } from "react";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";
import ChatInput from "@/app/components/chat/chat-input";
import { DAILY_MESSAGE_LIMIT, MAX_MESSAGE_CHARS, MAX_TURNS } from "@/app/lib/chat/limits";

export type ChatEntry = { id: string; role: "user" | "assistant"; text: string };
export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

/**
 * `remainingToday` is the visitor's messages left today: a number once the server has said,
 * undefined before that, and null when there's no limit (admins).
 */
export type ChatViewProps = {
  messages: ChatEntry[];
  status: ChatStatus;
  error: string | null;
  canRetry: boolean;
  remainingToday: number | null | undefined;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onNewChat: () => void;
};

const SUGGESTIONS = [
  "What are you working on right now?",
  "Which project are you proudest of?",
  "What do you do outside of school?",
];

function getBlockedReason(messages: ChatEntry[], remainingToday: number | null | undefined): string | null {
  if (remainingToday === 0) return `That's all ${DAILY_MESSAGE_LIMIT} messages for today. Come back tomorrow.`;
  const userTurns = messages.filter((message) => message.role === "user").length;
  if (userTurns >= MAX_TURNS) return `This chat reached ${MAX_TURNS} messages. Start a new chat to keep going.`;
  return null;
}

function getLimitNote(remainingToday: number | null | undefined): string | null {
  if (remainingToday === null) return null;
  if (remainingToday === undefined) return `${DAILY_MESSAGE_LIMIT} messages a day.`;
  return `${remainingToday} ${remainingToday === 1 ? "message" : "messages"} left today.`;
}

export default function ChatView({
  messages,
  status,
  error,
  canRetry,
  remainingToday,
  onSend,
  onStop,
  onRetry,
  onNewChat,
}: ChatViewProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";
  const blockedReason = getBlockedReason(messages, remainingToday);
  const limitNote = getLimitNote(remainingToday);
  const lastMessage = messages.at(-1);
  const isWaitingForText = isBusy && (lastMessage?.role === "user" || lastMessage?.text === "");

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, status]);

  return (
    <Panel name="chat" className="h-full flex flex-col gap-3 p-4">
      <div
        ref={logRef}
        role="log"
        aria-label="Conversation"
        aria-busy={isBusy || undefined}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-3 px-2 text-sm"
      >
        {messages.length === 0 ? (
          <p className="text-muted">
            Ask me about my work, projects, studies, or hobbies. An AI answers as me, from what I&apos;ve written down.
          </p>
        ) : (
          messages
            .filter((message) => message.text !== "")
            .map((message) => <ChatMessage key={message.id} role={message.role} text={message.text} />)
        )}
        {isWaitingForText && <ChatMessage role="assistant" text="..." />}
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          {canRetry && <button type="button" onClick={onRetry} className={actionClass}>[retry]</button>}
        </div>
      )}

      {blockedReason ? (
        <p className="px-2 text-sm text-muted">{blockedReason}</p>
      ) : (
        <>
          <Suggestions isDisabled={isBusy} onPick={onSend} />
          <ChatInput
            isBusy={isBusy}
            maxLength={MAX_MESSAGE_CHARS}
            placeholder="Ask me something"
            onSend={onSend}
            onStop={onStop}
          />
        </>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-muted">
        <p>Chats are logged.</p>
        {limitNote && <p>{limitNote}</p>}
        {messages.length > 0 && (
          <button type="button" onClick={onNewChat} disabled={isBusy} className={`${actionClass} ml-auto text-xs`}>
            [new chat]
          </button>
        )}
      </div>
    </Panel>
  );
}

function ChatMessage({ role, text }: { role: ChatEntry["role"]; text: string }) {
  const isUser = role === "user";
  return (
    <p className="whitespace-pre-wrap break-words">
      <span className={isUser ? "text-accent" : "text-border-accent"}>
        {isUser ? "you" : "tai"}
        <span aria-hidden="true"> ›</span>
      </span>{" "}
      <span className={isUser ? "text-muted" : "text-foreground"}>{text}</span>
    </p>
  );
}

function Suggestions({ isDisabled, onPick }: { isDisabled: boolean; onPick: (text: string) => void }) {
  return (
    <ul aria-label="Suggested questions" className="flex flex-wrap gap-x-4 px-2">
      {SUGGESTIONS.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            onClick={() => onPick(suggestion)}
            disabled={isDisabled}
            className={`${actionClass} px-0 text-left disabled:cursor-not-allowed`}
          >
            [{suggestion}]
          </button>
        </li>
      ))}
    </ul>
  );
}
