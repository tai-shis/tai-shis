"use client";

import { useId, useState } from "react";
import { actionClass } from "@/app/components/auth/action-class";

export type ChatInputProps = {
  isBusy: boolean;
  maxLength: number;
  placeholder: string;
  rows?: number;
  onSend: (text: string) => void;
  onStop: () => void;
};

/** Enter sends and Shift+Enter adds a line. While a reply is coming, [send] becomes [stop]. */
export default function ChatInput({ isBusy, maxLength, placeholder, rows = 2, onSend, onStop }: ChatInputProps) {
  const inputId = useId();
  const countId = `${inputId}-count`;
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const canSend = !isBusy && trimmed.length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends and Shift+Enter adds a line. Enter while an IME is composing confirms the text instead.
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    send();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex flex-col gap-1 px-2"
    >
      <label htmlFor={inputId} className="sr-only">Message</label>
      <textarea
        id={inputId}
        value={text}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-describedby={countId}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-w-0 resize-none border border-border bg-transparent px-2 py-1 text-sm text-foreground"
      />
      <div className="flex items-center gap-2">
        <p id={countId} className="text-xs text-muted">
          {text.length}/{maxLength}
        </p>
        <div className="ml-auto">
          {isBusy ? (
            <button type="button" onClick={onStop} className={actionClass}>[stop]</button>
          ) : (
            <button type="submit" disabled={!canSend} className={`${actionClass} disabled:cursor-not-allowed`}>[send]</button>
          )}
        </div>
      </div>
    </form>
  );
}
