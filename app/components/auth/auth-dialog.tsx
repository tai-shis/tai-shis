"use client";

import AuthDialogView, { type Account } from "@/app/components/auth/auth-dialog-view";
import AdminSection from "@/app/components/auth/admin/admin-section";
import { authClient } from "@/app/lib/auth-client";

async function signInWithGithub(): Promise<boolean> {
  const { error } = await authClient.signIn.social({ provider: "github", callbackURL: "/" });
  return !error;
}

async function signOut(): Promise<boolean> {
  const { error } = await authClient.signOut();
  return !error;
}

export default function AuthDialog() {
  const { data, isPending } = authClient.useSession();
  const account: Account | null = data ? { username: data.user.name } : null;
  const isAdmin = data?.user.role === "admin";

  return (
    <AuthDialogView account={account} isPending={isPending} onSignIn={signInWithGithub} onSignOut={signOut}>
      {isAdmin && data && <AdminSection currentUserId={data.user.id} />}
    </AuthDialogView>
  );
}
