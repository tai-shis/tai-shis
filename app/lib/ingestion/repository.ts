import { and, asc, desc, eq, gte, sum } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { ingestionMessages, ingestionSessions, pendingChanges } from "@/app/lib/db/ingestion-schema";
import { sources } from "@/app/lib/db/profile-schema";
import { getProfileRow } from "@/app/lib/profile/repository";
import { PROFILE_TABLE_KEYS, type ProfileFormValues, type ProfileTableKey } from "@/app/lib/profile/tables";
import type {
  IngestionSessionSummary,
  IngestionUIMessage,
  PendingChange,
  PendingChangeAction,
} from "@/app/lib/ingestion/types";

const SESSION_TITLE_CHARS = 80;
const SESSION_LIST_LIMIT = 20;

function getStartOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function toTitle(text: string): string {
  const firstLine = text.trim().split("\n")[0] ?? "";
  return firstLine.length > SESSION_TITLE_CHARS ? `${firstLine.slice(0, SESSION_TITLE_CHARS - 1)}…` : firstLine || "Untitled";
}

/** Creates the session, and the source its approved rows point at, on first use. */
export async function ensureIngestionSession(sessionId: string, firstMessage: string): Promise<{ sourceId: string | null }> {
  const [existing] = await db
    .select({ sourceId: ingestionSessions.sourceId })
    .from(ingestionSessions)
    .where(eq(ingestionSessions.id, sessionId));
  if (existing) return existing;

  const title = toTitle(firstMessage);
  const [source] = await db.insert(sources).values({ kind: "chat", title }).returning({ id: sources.id });
  await db.insert(ingestionSessions).values({ id: sessionId, title, sourceId: source.id }).onConflictDoNothing();
  return { sourceId: source.id };
}

export async function getSessionSourceId(sessionId: string | null): Promise<string | null> {
  if (!sessionId) return null;
  const [session] = await db
    .select({ sourceId: ingestionSessions.sourceId })
    .from(ingestionSessions)
    .where(eq(ingestionSessions.id, sessionId));
  return session?.sourceId ?? null;
}

type NewIngestionMessage = {
  sessionId: string;
  message: IngestionUIMessage;
  costUsd?: number;
};

/** A message resent after a failed reply is stored once. */
export async function saveIngestionMessage({ sessionId, message, costUsd }: NewIngestionMessage): Promise<void> {
  await db
    .insert(ingestionMessages)
    .values({
      id: message.id,
      sessionId,
      role: message.role === "user" ? "user" : "assistant",
      parts: message.parts,
      costUsd: costUsd?.toString(),
    })
    .onConflictDoNothing();
  await db.update(ingestionSessions).set({ updatedAt: new Date() }).where(eq(ingestionSessions.id, sessionId));
}

export async function getIngestionSpendTodayUsd(): Promise<number> {
  const [row] = await db
    .select({ value: sum(ingestionMessages.costUsd) })
    .from(ingestionMessages)
    .where(gte(ingestionMessages.createdAt, getStartOfUtcDay()));
  return Number(row?.value ?? 0);
}

export async function listIngestionSessions(): Promise<IngestionSessionSummary[]> {
  const rows = await db
    .select({ id: ingestionSessions.id, title: ingestionSessions.title, createdAt: ingestionSessions.createdAt })
    .from(ingestionSessions)
    .orderBy(desc(ingestionSessions.updatedAt))
    .limit(SESSION_LIST_LIMIT);
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function listIngestionMessages(sessionId: string): Promise<IngestionUIMessage[]> {
  const rows = await db
    .select()
    .from(ingestionMessages)
    .where(eq(ingestionMessages.sessionId, sessionId))
    .orderBy(asc(ingestionMessages.createdAt));
  return rows.map((row) => ({ id: row.id, role: row.role, parts: row.parts as IngestionUIMessage["parts"] }));
}

type NewPendingChange = {
  sessionId: string;
  table: ProfileTableKey;
  action: PendingChangeAction;
  targetRowId?: string;
  values?: ProfileFormValues;
  reason?: string;
};

export async function insertPendingChange(change: NewPendingChange): Promise<string> {
  const [row] = await db
    .insert(pendingChanges)
    .values({
      sessionId: change.sessionId,
      profileTable: change.table,
      action: change.action,
      targetRowId: change.targetRowId,
      values: change.values,
      reason: change.reason,
    })
    .returning({ id: pendingChanges.id });
  return row.id;
}

function isProfileTableKey(value: string): value is ProfileTableKey {
  return (PROFILE_TABLE_KEYS as readonly string[]).includes(value);
}

/** Oldest first, each with the row it changes as that row is now. */
export async function listPendingChanges(): Promise<PendingChange[]> {
  const rows = await db
    .select()
    .from(pendingChanges)
    .where(eq(pendingChanges.status, "pending"))
    .orderBy(asc(pendingChanges.createdAt));
  const changes = rows.filter((row) => isProfileTableKey(row.profileTable));
  return Promise.all(
    changes.map(async (row) => {
      const table = row.profileTable as ProfileTableKey;
      const current = row.targetRowId ? await getProfileRow(table, row.targetRowId) : null;
      return {
        id: row.id,
        table,
        action: row.action,
        values: row.values ?? {},
        current: current?.values ?? null,
        reason: row.reason,
      };
    }),
  );
}

export type ClaimedPendingChange = {
  id: string;
  table: ProfileTableKey;
  action: PendingChangeAction;
  targetRowId: string | null;
  values: ProfileFormValues;
  sessionId: string | null;
};

/**
 * Moves a pending change to `status` and returns it. Resolves to null when it isn't pending,
 * so two clicks can't apply the same change twice.
 */
export async function claimPendingChange(id: string, status: "approved" | "rejected"): Promise<ClaimedPendingChange | null> {
  const [row] = await db
    .update(pendingChanges)
    .set({ status, resolvedAt: new Date() })
    .where(and(eq(pendingChanges.id, id), eq(pendingChanges.status, "pending")))
    .returning();
  if (!row || !isProfileTableKey(row.profileTable)) return null;
  return {
    id: row.id,
    table: row.profileTable,
    action: row.action,
    targetRowId: row.targetRowId,
    values: row.values ?? {},
    sessionId: row.sessionId,
  };
}

/** Puts a claimed change back up for review after applying it failed. */
export async function releasePendingChange(id: string): Promise<void> {
  await db.update(pendingChanges).set({ status: "pending", resolvedAt: null }).where(eq(pendingChanges.id, id));
}
