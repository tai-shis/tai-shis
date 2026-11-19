import { openrouter } from "@openrouter/ai-sdk-provider";

export const publicChatModel = openrouter("anthropic/claude-haiku-5.5");
export const ingestionModel = openrouter("anthropic/claude-sonnet-5.5");
