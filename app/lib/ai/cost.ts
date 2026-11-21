import type { LanguageModelUsage } from "ai";
import type { TokenPrices } from "@/app/lib/ai/models";

/** OpenRouter reports the exact charge per call. List prices are the fallback if it doesn't. */
function getCallCostUsd(usage: LanguageModelUsage, prices: TokenPrices): number {
  const reported = (usage.raw as { cost?: unknown } | undefined)?.cost;
  if (typeof reported === "number") return reported;
  return (usage.inputTokens ?? 0) * prices.input + (usage.outputTokens ?? 0) * prices.output;
}

/** Total cost of a multi-step generation: each step is its own model call. */
export function getStepsCostUsd(steps: ReadonlyArray<{ usage: LanguageModelUsage }>, prices: TokenPrices): number {
  return steps.reduce((total, step) => total + getCallCostUsd(step.usage, prices), 0);
}
