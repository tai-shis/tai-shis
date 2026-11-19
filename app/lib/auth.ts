import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { db } from "@/app/lib/db";
import * as schema from "@/app/lib/db/schema";

const COUNTRY_CODE = /^[A-Z]{2}$/;

function countryFrom(headers: Headers | undefined): string | null {
  const value = headers?.get("x-vercel-ip-country")?.toUpperCase();
  return value && COUNTRY_CODE.test(value) ? value : null;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  account: { encryptOAuthTokens: true },
  user: {
    additionalFields: {
      country: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => ({
          data: { ...user, country: countryFrom(ctx?.headers) },
        }),
      },
    },
    session: {
      create: {
        // IP stays available for rate limiting but is never persisted.
        before: async (session) => ({ data: { ...session, ipAddress: null } }),
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!ctx.path?.startsWith("/api-key/")) return;
      const session = await getSessionFromCtx(ctx);
      if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
        throw new APIError("FORBIDDEN");
      }
    }),
  },
  plugins: [admin(), apiKey(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
