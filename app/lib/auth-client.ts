import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";
import type { auth } from "@/app/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), adminClient(), apiKeyClient()],
});
