"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { FaGithub } from "react-icons/fa";
import Panel from "@/app/components/panel";
import AnimatedText from "@/app/components/animated-text";

const actionClass = "inline-flex items-center gap-2 px-2 py-1 text-sm text-muted hover:text-accent transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60";

export type Account = { username: string };

/** Each action resolves to true when it succeeded. `children` renders below the account details when signed in. */
export type AuthDialogViewProps = {
  account: Account | null;
  isPending: boolean;
  onSignIn: () => Promise<boolean>;
  onSignOut: () => Promise<boolean>;
  children?: React.ReactNode;
};

function triggerLabel(account: Account | null, isPending: boolean): string {
  if (isPending) return "...";
  return account ? account.username : "login";
}

export default function AuthDialogView({ account, isPending, onSignIn, onSignOut, children }: AuthDialogViewProps) {
  const hasExtraContent = Boolean(account && children);

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-busy={isPending || undefined}
        className="px-4 py-2 text-sm text-muted hover:text-accent transition-colors cursor-pointer max-w-48 truncate"
      >
        [{triggerLabel(account, isPending)}]
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`fixed inset-x-4 top-1/2 z-50 mx-auto max-h-4/5 -translate-y-1/2 overflow-y-auto overscroll-contain pt-2 no-scrollbar ${hasExtraContent ? "max-w-xl" : "max-w-sm"}`}
        >
          <Panel name="auth" heading={false} active className="p-4 flex flex-col gap-4">
            <Dialog.Title className="sr-only">{account ? "Account" : "Log in"}</Dialog.Title>
            {account ? <SignedIn account={account} onSignOut={onSignOut} /> : <SignedOut onSignIn={onSignIn} />}
            {account && children}
          </Panel>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SignedOut({ onSignIn }: { onSignIn: () => Promise<boolean> }) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setIsStarting(true);
    if (await onSignIn()) return;
    setIsStarting(false);
    setError("Unable to start GitHub sign-in. Try again.");
  };

  return (
    <>
      <p className="text-sm text-muted px-2">
        I just want your github username, icon, and country :D
      </p>
      <ActionRow>
        <button onClick={handleSignIn} disabled={isStarting} className={actionClass}>
          <FaGithub size={14} aria-hidden="true" />
          [sign in with github]
        </button>
      </ActionRow>
      {error && <p role="alert" className="text-sm text-destructive px-2">{error}</p>}
    </>
  );
}

function SignedIn({ account, onSignOut }: { account: Account; onSignOut: () => Promise<boolean> }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);
    const succeeded = await onSignOut();
    setIsSigningOut(false);
    if (!succeeded) setError("Unable to sign out. Try again.");
  };

  return (
    <>
      <p className="text-sm text-muted px-2">
        Signed in as @<AnimatedText text={account.username} intro="scan" />
      </p>
      <ActionRow>
        <button onClick={handleSignOut} disabled={isSigningOut} className={actionClass}>
          [sign out]
        </button>
      </ActionRow>
      {error && <p role="alert" className="text-sm text-destructive px-2">{error}</p>}
    </>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      {children}
      <Dialog.Close className={actionClass}>[close]</Dialog.Close>
    </div>
  );
}
