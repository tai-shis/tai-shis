import { and, count, eq, gte, sum } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { chatConversations, chatMessages } from "@/app/lib/db/chat-schema";

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

export async function countUserMessagesToday(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(chatMessages)
    .where(and(eq(chatMessages.userId, userId), eq(chatMessages.role, "user"), gte(chatMessages.createdAt, getStartOfUtcDay())));
  return row?.value ?? 0;
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
