import type { UIMessage } from "ai";

/** Messages a non-admin can send per UTC day. Admins have no daily limit. */
export const DAILY_MESSAGE_LIMIT = 10;
/** User messages per conversation before a new chat is needed. */
export const MAX_TURNS = 10;
export const MAX_MESSAGE_CHARS = 500;
/** Spend across all public chats per UTC day, in US dollars. */
export const DAILY_SPEND_CAP_USD = 0.3;

/** `remainingToday` is null for admins, who have no daily limit. */
export type ChatMessageMetadata = { remainingToday: number | null };
export type ChatUIMessage = UIMessage<ChatMessageMetadata>;
