"use client";

import { useId, useState } from "react";
import { actionClass } from "@/app/components/auth/action-class";

export type ChatInputProps = {
  isBusy: boolean;
  maxLength: number;
  placeholder: string;
  rows?: number;
  /** Lets an empty message be sent, e.g. when a file is attached. */
  allowEmpty?: boolean;
  /** Holds sending back without showing [stop], e.g. while a file is still being read. */
  sendDisabled?: boolean;
  /** Stops typing too, e.g. until proposals are reviewed. */
  inputDisabled?: boolean;
  /** Extra controls on the left of the bottom row. */
  accessory?: React.ReactNode;
  onSend: (text: string) => void;
  onStop: () => void;
};

/** Enter sends and Shift+Enter adds a line. While a reply is coming, [send] becomes [stop]. */
export default function ChatInput({
  isBusy,
  maxLength,
  placeholder,
  rows = 2,
  allowEmpty = false,
  sendDisabled = false,
  inputDisabled = false,
  accessory,
  onSend,
  onStop,
}: ChatInputProps) {
  const inputId = useId();
  const countId = `${inputId}-count`;
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const canSend = !isBusy && !sendDisabled && (allowEmpty || trimmed.length > 0);

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
        disabled={inputDisabled}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-describedby={countId}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-w-0 resize-none border border-border bg-transparent px-2 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex items-center gap-2">
        {accessory}
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
