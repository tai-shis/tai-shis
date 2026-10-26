"use client";

import { useEffect } from "react";
import Panel from "@/app/components/panel";
import { shouldIgnoreShortcut } from "@/app/lib/shortcuts";

const labels = ["home", "projects", "resume", "hobbies"];

interface NavProps {
  index: number;
  onNavigate: (i: number) => void;
}

export default function Nav({ index, onNavigate }: NavProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;
      const i = parseInt(e.key);
      if (!isNaN(i) && i >= 1 && i <= labels.length) onNavigate(i - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNavigate]);

  return (
    <nav aria-label="Sections">
      <Panel name="nav" heading={false} className="flex gap-0 z-10">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => onNavigate(i)}
            aria-current={index === i ? "true" : undefined}
            className={`px-4 py-2 text-sm transition-colors cursor-pointer ${
              index === i ? "text-accent" : "text-muted hover:text-accent"
            }`}
          >
            <span className="sm:inline hidden">[{i + 1}] </span>
            {label}
          </button>
        ))}
      </Panel>
    </nav>
  );
}
