"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/app/lib/reduced-motion";

type Phase = "typing" | "scanning" | "idle";

export type AnimatedTextProps = {
  text: string;
  intro?: "typewriter" | "scan";
};

export default function AnimatedText({ text, intro = "typewriter" }: AnimatedTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const firstPhase: Phase = intro === "typewriter" ? "typing" : "scanning";
  const [phase, setPhase] = useState<Phase>(firstPhase);
  const [charCount, setCharCount] = useState(0);
  const [scanPos, setScanPos] = useState(0);
  const [scanDir, setScanDir] = useState(1);
  const [prevText, setPrevText] = useState(text);

  if (prevText !== text) {
    setPrevText(text);
    setPhase(firstPhase);
    setCharCount(0);
    setScanPos(0);
    setScanDir(1);
  }

  useEffect(() => {
    if (prefersReducedMotion || phase !== "typing") return;
    if (charCount >= text.length) {
      const t = setTimeout(() => { setPhase("scanning"); setScanPos(0); setScanDir(1); }, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCharCount((c) => c + 1), 40);
    return () => clearTimeout(t);
  }, [prefersReducedMotion, phase, charCount, text]);

  useEffect(() => {
    if (prefersReducedMotion || phase !== "scanning") return;
    if (scanPos <= -3 && scanDir === -1) {
      const t = setTimeout(() => setPhase("idle"), 50);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (scanPos >= text.length && scanDir === 1) {
        setScanDir(-1);
      } else {
        setScanPos((p) => p + scanDir);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [prefersReducedMotion, phase, scanPos, scanDir, text]);

  if (prefersReducedMotion) return <span>{text}</span>;

  if (phase === "typing") {
    return <span>{text.slice(0, charCount)}</span>;
  }

  if (phase === "scanning") {
    return (
      <span>
        {text.split("").map((char, i) => (
          <span key={i} className={i >= scanPos && i < scanPos + 3 ? "text-accent" : ""}>
            {char}
          </span>
        ))}
      </span>
    );
  }

  return <span>{text}</span>;
}
