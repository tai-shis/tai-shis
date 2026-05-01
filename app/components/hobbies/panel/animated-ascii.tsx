"use client";

import { useEffect, useState } from "react";

type Phase = "scanning" | "idle";

export default function AnimatedAscii({ text, className }: { text: string; className?: string }) {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanPos, setScanPos] = useState(0);
  const [scanDir, setScanDir] = useState(1);

  const lines = text.split("\n");
  const maxWidth = Math.max(...lines.map((l) => l.length));

  useEffect(() => {
    if (phase === "idle") {
      const t = setTimeout(() => { setPhase("scanning"); setScanPos(0); setScanDir(1); }, 2500);
      return () => clearTimeout(t);
    }

    if (scanPos <= -3 && scanDir === -1) {
      const t = setTimeout(() => setPhase("idle"), 50);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      if (scanPos >= maxWidth && scanDir === 1) {
        setScanDir(-1);
      } else {
        setScanPos((p) => p + scanDir);
      }
    }, 20);
    return () => clearTimeout(t);
  }, [phase, scanPos, scanDir, maxWidth]);

  if (phase === "scanning") {
    return (
      <pre className={className}>
        {lines.map((line, li) => (
          <span key={li}>
            {line.split("").map((char, ci) => (
              <span key={ci} className={ci >= scanPos && ci < scanPos + 3 ? "text-accent" : ""}>
                {char}
              </span>
            ))}
            {li < lines.length - 1 ? "\n" : ""}
          </span>
        ))}
      </pre>
    );
  }

  return <pre className={className}>{text}</pre>;
}
