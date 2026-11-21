"use client";

import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import Panel from "@/app/components/panel";
import { actionClass } from "@/app/components/auth/action-class";

/** `onSignIn` resolves to true once the redirect to GitHub has started. */
export type ChatSignInProps = {
  onSignIn: () => Promise<boolean>;
};

export default function ChatSignIn({ onSignIn }: ChatSignInProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coming back with Back restores the page from the back-forward cache with the button still disabled.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsStarting(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setIsStarting(true);
    if (await onSignIn()) return;
    setIsStarting(false);
    setError("Unable to start GitHub sign-in. Try again.");
  };

  return (
    <Panel name="chat" className="flex flex-col gap-3 p-4">
      <p className="px-2 text-sm text-muted">
        Ask me about my work, projects, studies, or hobbies. An AI answers as me, from what I&apos;ve written down.
      </p>
      <p className="px-2 text-sm text-muted">Sign in with GitHub to start. Chats are logged.</p>
      <div>
        <button type="button" onClick={handleSignIn} disabled={isStarting} className={actionClass}>
          <FaGithub size={14} aria-hidden="true" />
          [sign in with github]
        </button>
      </div>
      {error && <p role="alert" className="px-2 text-sm text-destructive">{error}</p>}
    </Panel>
  );
}
