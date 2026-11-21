import { after } from "next/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  safeValidateUIMessages,
  streamText,
  tool,
  toUIMessageStream,
  type LanguageModelUsage,
} from "ai";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { PUBLIC_CHAT_PRICE_PER_TOKEN_USD, publicChatModel } from "@/app/lib/ai/models";
import { buildChatInstructions } from "@/app/lib/chat/prompt";
import {
  claimConversation,
  countUserMessagesToday,
  getSpendTodayUsd,
  insertChatMessage,
} from "@/app/lib/chat/repository";
import {
  DAILY_MESSAGE_LIMIT,
  DAILY_SPEND_CAP_USD,
  MAX_MESSAGE_CHARS,
  MAX_TURNS,
  type ChatMessageMetadata,
  type ChatUIMessage,
} from "@/app/lib/chat/limits";
import { searchVisibleProfileNotes } from "@/app/lib/profile/repository";

export const maxDuration = 30;

// History comes from the browser, so its total size is capped: a forged history could
// otherwise make every request arbitrarily expensive.
const MAX_BODY_CHARS = 60_000;
const MAX_REPLY_TOKENS = 500;
const MAX_STEPS = 3;
const SEARCH_RESULT_LIMIT = 6;

const searchProfile = tool({
  description:
    "Search Tai's written answers to interview questions and other notes about Tai. Use a few keywords from the visitor's question.",
  inputSchema: z.object({
    query: z.string().min(1).max(200).describe("A few keywords, like 'favorite language typescript'."),
  }),
  execute: async ({ query }) => {
    const matches = await searchVisibleProfileNotes(query, SEARCH_RESULT_LIMIT);
    return matches.length > 0 ? matches.map((match) => match.text) : "No matching notes.";
  },
});

const tools = { search_profile: searchProfile };

const requestSchema = z.object({
  id: z.uuid(),
  messages: z
    .array(
      z.looseObject({
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.looseObject({ type: z.string(), text: z.unknown().optional() })),
      }),
    )
    .min(1)
    .max(MAX_TURNS * 2 - 1),
});

type RequestMessage = z.infer<typeof requestSchema>["messages"][number];

// Visitors send text only. Earlier replies keep their text and searches, so a follow-up can
// still see what an answer was based on. Every other part type is dropped.
const ALLOWED_PART_TYPES: Record<RequestMessage["role"], Set<string>> = {
  user: new Set(["text"]),
  assistant: new Set(["step-start", "text", "tool-search_profile"]),
};

function keepAllowedParts(messages: RequestMessage[]): RequestMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part) => ALLOWED_PART_TYPES[message.role].has(part.type)),
  }));
}

function getText(message: RequestMessage): string {
  return message.parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function isValidConversation(messages: RequestMessage[]): boolean {
  if (messages.at(-1)?.role !== "user") return false;
  const userMessages = messages.filter((message) => message.role === "user");
  if (userMessages.length > MAX_TURNS) return false;
  return userMessages.every((message) => {
    const text = getText(message);
    return text.length > 0 && text.length <= MAX_MESSAGE_CHARS;
  });
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/** OpenRouter reports the exact charge per call. Token prices are the fallback if it doesn't. */
function getCallCostUsd(usage: LanguageModelUsage): number {
  const reported = (usage.raw as { cost?: unknown } | undefined)?.cost;
  if (typeof reported === "number") return reported;
  const { input, output } = PUBLIC_CHAT_PRICE_PER_TOKEN_USD;
  return (usage.inputTokens ?? 0) * input + (usage.outputTokens ?? 0) * output;
}

function textResponse(status: number, message: string): Response {
  return new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

const badRequest = () => textResponse(400, "That message couldn't be sent. Start a new chat and try again.");

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return textResponse(401, "Sign in to chat.");

  const body = await request.text();
  if (body.length > MAX_BODY_CHARS) return badRequest();
  const parsed = requestSchema.safeParse(parseJson(body));
  if (!parsed.success) return badRequest();
  const messages = keepAllowedParts(parsed.data.messages);
  if (!isValidConversation(messages)) return badRequest();
  const validated = await safeValidateUIMessages<ChatUIMessage>({ messages, tools });
  if (!validated.success) return badRequest();

  const conversationId = parsed.data.id;
  const userId = session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!(await claimConversation(conversationId, userId))) {
    return textResponse(403, "This chat belongs to another account. Start a new chat.");
  }

  const [sentToday, spentToday] = await Promise.all([
    isAdmin ? Promise.resolve(0) : countUserMessagesToday(userId),
    getSpendTodayUsd(),
  ]);
  if (!isAdmin && sentToday >= DAILY_MESSAGE_LIMIT) {
    return textResponse(429, `You've used today's ${DAILY_MESSAGE_LIMIT} messages. Come back tomorrow.`);
  }
  if (spentToday >= DAILY_SPEND_CAP_USD) {
    return textResponse(503, "The chat is taking a break for today. Try again tomorrow.");
  }

  await insertChatMessage({ conversationId, userId, role: "user", content: getText(messages.at(-1)!) });
  const metadata: ChatMessageMetadata = { remainingToday: isAdmin ? null : DAILY_MESSAGE_LIMIT - sentToday - 1 };

  const result = streamText({
    model: publicChatModel,
    instructions: await buildChatInstructions(),
    messages: await convertToModelMessages(validated.data, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
    maxOutputTokens: MAX_REPLY_TOKENS,
    onEnd: async ({ text, steps }) => {
      const costUsd = steps.reduce((total, step) => total + getCallCostUsd(step.usage), 0);
      await insertChatMessage({ conversationId, userId, role: "assistant", content: text, costUsd });
    },
  });

  // Runs the reply to the end even if the visitor leaves, so its cost is always recorded.
  after(Promise.resolve(result.consumeStream()));

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      messageMetadata: ({ part }) => (part.type === "start" ? metadata : undefined),
      onError: (error) => {
        console.error("Public chat failed", error);
        return "Something went wrong. Try again.";
      },
    }),
  });
}
