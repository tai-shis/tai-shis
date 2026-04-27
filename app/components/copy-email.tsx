"use client";

import { FaEnvelope } from "react-icons/fa";
import { useState } from "react";

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

export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    await navigator.clipboard.writeText(email);
    burst(e.clientX, e.clientY);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
    >
      <span className="hidden sm:inline"><FaEnvelope size={14} /></span>
      {copied ? "Yoink" : "Email"}
    </button>
  );
}
