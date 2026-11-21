"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Panel from "@/app/components/panel";
import ChatSignIn from "@/app/components/chat/chat-sign-in";
import ChatView, { type ChatEntry } from "@/app/components/chat/chat-view";
import { authClient, signInWithGithub } from "@/app/lib/auth-client";
import type { ChatUIMessage } from "@/app/lib/chat/limits";

const transport = new DefaultChatTransport<ChatUIMessage>({ api: "/api/chat" });

// The server answers these with a message meant for the visitor, and retrying won't change it.
const FINAL_ERROR_STATUSES = new Set([400, 401, 403, 429, 503]);
const GENERIC_ERROR = "Something went wrong. Try again.";

function describeError(error: Error | undefined): { message: string; canRetry: boolean } | null {
  if (!error) return null;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number" && FINAL_ERROR_STATUSES.has(statusCode)) {
    return { message: error.message, canRetry: false };
  }
  return { message: GENERIC_ERROR, canRetry: true };
}

function toChatEntry(message: ChatUIMessage): ChatEntry {
  const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
  return { id: message.id, role: message.role === "user" ? "user" : "assistant", text };
}

function getLatestRemaining(messages: ChatUIMessage[]): number | null | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const remaining = messages[i].metadata?.remainingToday;
    if (remaining !== undefined) return remaining;
  }
  return undefined;
}

export default function ChatPanel() {
  const { data, isPending } = authClient.useSession();
  const [chatId, setChatId] = useState(() => crypto.randomUUID());
  // Carries the daily count into a new chat, which starts with no messages to read it from.
  const [carriedRemaining, setCarriedRemaining] = useState<number | null | undefined>(undefined);

  if (isPending) {
    return (
      <Panel name="chat" className="p-4">
        <p className="px-2 text-sm text-muted" aria-busy="true">...</p>
      </Panel>
    );
  }
  if (!data) return <ChatSignIn onSignIn={signInWithGithub} />;

  const isAdmin = data.user.role === "admin";
  return (
    <Conversation
      key={chatId}
      chatId={chatId}
      initialRemaining={isAdmin ? null : carriedRemaining}
      onNewChat={(remaining) => {
        setCarriedRemaining(remaining);
        setChatId(crypto.randomUUID());
      }}
    />
  );
}

type ConversationProps = {
  chatId: string;
  initialRemaining: number | null | undefined;
  onNewChat: (remaining: number | null | undefined) => void;
};

function Conversation({ chatId, initialRemaining, onNewChat }: ConversationProps) {
  const { messages, sendMessage, status, error, stop, regenerate } = useChat<ChatUIMessage>({ id: chatId, transport });
  const remainingToday = getLatestRemaining(messages) ?? initialRemaining;
  const errorState = describeError(error);

  return (
    <ChatView
      messages={messages.map(toChatEntry)}
      status={status}
      error={errorState?.message ?? null}
      canRetry={errorState?.canRetry ?? false}
      remainingToday={remainingToday}
      onSend={(text) => sendMessage({ text })}
      onStop={stop}
      onRetry={() => regenerate()}
      onNewChat={() => onNewChat(remainingToday)}
    />
  );
}
