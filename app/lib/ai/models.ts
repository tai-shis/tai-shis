import { openrouter } from "@openrouter/ai-sdk-provider";

// Automatic caching reuses the profile prompt and earlier turns across requests.
export const publicChatModel = openrouter("anthropic/claude-haiku-5.5", { cache_control: { type: "ephemeral" } });
export const ingestionModel = openrouter("anthropic/claude-sonnet-5.5");

/** List prices, used only when OpenRouter doesn't report a call's cost. */
export const PUBLIC_CHAT_PRICE_PER_TOKEN_USD = { input: 0.1 / 1_000_000, output: 0.5 / 1_000_000 };
