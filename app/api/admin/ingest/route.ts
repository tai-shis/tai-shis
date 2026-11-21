import { after } from "next/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
} from "ai";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { getStepsCostUsd } from "@/app/lib/ai/cost";
import { INGESTION_PRICES, ingestionModel } from "@/app/lib/ai/models";
import { buildIngestionInstructions } from "@/app/lib/ingestion/prompt";
import {
  ensureIngestionSession,
  getIngestionSpendTodayUsd,
  saveIngestionMessage,
} from "@/app/lib/ingestion/repository";
import { createIngestionTools } from "@/app/lib/ingestion/tools";
import {
  INGESTION_DAILY_SPEND_CAP_USD,
  MAX_INGESTION_MESSAGE_CHARS,
  type IngestionUIMessage,
} from "@/app/lib/ingestion/types";

export const maxDuration = 120;

const MAX_BODY_CHARS = 1_000_000;
const MAX_MESSAGES = 200;
const MAX_STEPS = 12;
const MAX_REPLY_TOKENS = 4000;
// streamText reports cost when it ends, which is normally before the reply message is complete.
const COST_WAIT_MS = 5000;

const requestSchema = z.object({
  id: z.uuid(),
  messages: z
    .array(
      z.looseObject({
        id: z.string().min(1).max(100),
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.looseObject({ type: z.string(), text: z.unknown().optional() })),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES),
});

type RequestMessage = z.infer<typeof requestSchema>["messages"][number];

function getText(message: RequestMessage): string {
  return message.parts
    .map((part) => (part.type === "text" && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function textResponse(status: number, message: string): Response {
  return new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

const badRequest = () => textResponse(400, "That message couldn't be sent. Start a new session and try again.");

function waitForCost(cost: Promise<number>): Promise<number | undefined> {
  return Promise.race([cost, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), COST_WAIT_MS))]);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user.role !== "admin") return textResponse(404, "Not found.");

  const body = await request.text();
  if (body.length > MAX_BODY_CHARS) return badRequest();
  const parsed = requestSchema.safeParse(parseJson(body));
  if (!parsed.success) return badRequest();

  const { id: sessionId, messages } = parsed.data;
  const lastMessage = messages.at(-1)!;
  const question = getText(lastMessage);
  if (lastMessage.role !== "user" || question === "" || question.length > MAX_INGESTION_MESSAGE_CHARS) return badRequest();

  const tools = createIngestionTools(sessionId);
  const validated = await safeValidateUIMessages<IngestionUIMessage>({ messages, tools });
  if (!validated.success) return badRequest();

  if ((await getIngestionSpendTodayUsd()) >= INGESTION_DAILY_SPEND_CAP_USD) {
    return textResponse(503, `Ingestion hit today's $${INGESTION_DAILY_SPEND_CAP_USD} limit. Try again tomorrow.`);
  }

  const firstUserMessage = messages.find((message) => message.role === "user")!;
  await ensureIngestionSession(sessionId, getText(firstUserMessage));
  await saveIngestionMessage({ sessionId, message: validated.data.at(-1)! });

  let reportCost: (costUsd: number) => void = () => {};
  const cost = new Promise<number>((resolve) => {
    reportCost = resolve;
  });

  const result = streamText({
    model: ingestionModel,
    instructions: buildIngestionInstructions(),
    messages: await convertToModelMessages(validated.data, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
    maxOutputTokens: MAX_REPLY_TOKENS,
    onEnd: ({ steps }) => reportCost(getStepsCostUsd(steps, INGESTION_PRICES)),
  });

  // Runs the reply to the end even if the page closes, so proposals and cost are always recorded.
  after(Promise.resolve(result.consumeStream()));

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: validated.data,
      generateMessageId: () => crypto.randomUUID(),
      onEnd: async ({ responseMessage }) => {
        await saveIngestionMessage({ sessionId, message: responseMessage, costUsd: await waitForCost(cost) });
      },
      onError: (error) => {
        console.error("Ingestion chat failed", error);
        return "Something went wrong. Try again.";
      },
    }),
  });
}
