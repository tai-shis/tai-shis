import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";
import type { auth } from "@/app/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), adminClient(), apiKeyClient()],
});

/** Resolves to true once the redirect to GitHub has started. */
export async function signInWithGithub(): Promise<boolean> {
  const { error } = await authClient.signIn.social({ provider: "github", callbackURL: "/" });
  return !error;
}
