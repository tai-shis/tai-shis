"use client";

import { useRef, useState } from "react";

interface CopyButtonProps {
  label: string;
  copyText: string;
  reactionText: string;
  icon?: React.ReactNode;
  className?: string;
}

type Status = "idle" | "copied" | "failed";

function burst(x: number, y: number) {
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement("div");
    dot.className = "sparkle";
    dot.style.left = x + "px";
    dot.style.top = y + "px";

    const angle = (i / 12) * 2 * Math.PI;
    const dist = 50 + Math.random() * 40;
    dot.style.setProperty("--tx", Math.cos(angle) * dist + "px");
    dot.style.setProperty("--ty", Math.sin(angle) * dist + "px");

    document.body.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  }
}

export default function CopyButton({ label, copyText, reactionText, icon, className }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showStatus = (next: Status, ms: number) => {
    clearTimeout(resetTimer.current);
    setStatus(next);
    resetTimer.current = setTimeout(() => setStatus("idle"), ms);
  };

  const handleClick = async (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    try {
      await navigator.clipboard.writeText(copyText);
      burst(clientX, clientY);
      showStatus("copied", 1000);
    } catch {
      showStatus("failed", 5000);
    }
  };

  const visibleText = { idle: label, copied: reactionText, failed: copyText }[status];
  const announcement = {
    idle: "",
    copied: `${label} copied`,
    failed: `Couldn't copy. ${label}: ${copyText}`,
  }[status];

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={label}
        className={`inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors cursor-pointer ${className ?? ""}`}
      >
        {icon}
        <span className={status === "idle" ? "sr-only sm:not-sr-only" : ""}>{visibleText}</span>
      </button>
      <span role="status" className="sr-only">{announcement}</span>
    </>
  );
}
