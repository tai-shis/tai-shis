import { eq, gte, lt, sql, sum } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { chatConversations, chatMessages, chatUsage } from "@/app/lib/db/chat-schema";

function getStartOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Creates the conversation on first use. Resolves to false when it belongs to someone else. */
export async function claimConversation(conversationId: string, userId: string): Promise<boolean> {
  await db.insert(chatConversations).values({ id: conversationId, userId }).onConflictDoNothing();
  const [conversation] = await db
    .select({ userId: chatConversations.userId })
    .from(chatConversations)
    .where(eq(chatConversations.id, conversationId));
  return conversation?.userId === userId;
}

/**
 * Uses up one of today's messages. Resolves to how many are left, or null when none were.
 * The check and the increment are one statement, so concurrent requests can't overshoot.
 */
export async function claimDailyMessage(userId: string, limit: number): Promise<number | null> {
  const day = getStartOfUtcDay().toISOString().slice(0, 10);
  const [row] = await db
    .insert(chatUsage)
    .values({ userId, day, count: 1 })
    .onConflictDoUpdate({
      target: [chatUsage.userId, chatUsage.day],
      set: { count: sql`${chatUsage.count} + 1` },
      setWhere: lt(chatUsage.count, limit),
    })
    .returning({ count: chatUsage.count });
  return row ? limit - row.count : null;
}

export async function getSpendTodayUsd(): Promise<number> {
  const [row] = await db
    .select({ value: sum(chatMessages.costUsd) })
    .from(chatMessages)
    .where(gte(chatMessages.createdAt, getStartOfUtcDay()));
  return Number(row?.value ?? 0);
}

type NewChatMessage = {
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  costUsd?: number;
};

export async function insertChatMessage(message: NewChatMessage): Promise<void> {
  await db.insert(chatMessages).values({ ...message, costUsd: message.costUsd?.toString() });
}
