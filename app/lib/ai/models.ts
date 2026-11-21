import { openrouter } from "@openrouter/ai-sdk-provider";

// Automatic caching reuses the instructions and earlier turns across requests.
export const publicChatModel = openrouter("anthropic/claude-haiku-5.5", { cache_control: { type: "ephemeral" } });
export const ingestionModel = openrouter("anthropic/claude-sonnet-5.5", { cache_control: { type: "ephemeral" } });

export type TokenPrices = { input: number; output: number };

/** List prices per token, used only when OpenRouter doesn't report a call's cost. */
export const PUBLIC_CHAT_PRICES: TokenPrices = { input: 0.1 / 1_000_000, output: 0.5 / 1_000_000 };
export const INGESTION_PRICES: TokenPrices = { input: 2 / 1_000_000, output: 10 / 1_000_000 };
