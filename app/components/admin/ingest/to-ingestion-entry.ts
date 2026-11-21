import type { IngestionBlock, IngestionEntry, IngestionStep } from "@/app/components/admin/ingest/ingestion-chat-view";
import type { IngestionUIMessage } from "@/app/lib/ingestion/types";
import { getEmptyFormValues, PROFILE_TABLE_KEYS, profileTables, type ProfileTableKey } from "@/app/lib/profile/tables";

type ToolPart = {
  type: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

type ToolInput = { table?: unknown; values?: unknown };

function isTableKey(value: unknown): value is ProfileTableKey {
  return typeof value === "string" && (PROFILE_TABLE_KEYS as readonly string[]).includes(value);
}

function asValues(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

/** What the step did, in words, e.g. "proposed add position: Developer @ Acme". */
function describeStep(toolName: string, input: ToolInput, isDone: boolean): string {
  const table = isTableKey(input.table) ? input.table : null;
  const config = table ? profileTables[table] : null;
  const item = config?.itemLabel ?? "entry";
  const values = asValues(input.values);

  switch (toolName) {
    case "list_profile":
      return `${isDone ? "read" : "reading"} ${config?.label ?? "profile"}`;
    case "propose_create": {
      const title = config ? config.describeRow({ ...getEmptyFormValues(config.fields), ...values }) : "";
      return `${isDone ? "proposed" : "proposing"} add ${item}${title.trim() ? `: ${title}` : ""}`;
    }
    case "propose_update": {
      const changed = config?.fields.filter((field) => field.name in values).map((field) => field.label) ?? [];
      return `${isDone ? "proposed" : "proposing"} edit ${item}${changed.length > 0 ? ` (${changed.join(", ")})` : ""}`;
    }
    case "propose_delete":
      return `${isDone ? "proposed" : "proposing"} delete ${item}`;
    default:
      return toolName;
  }
}

function getOutputError(output: unknown): string | null {
  if (typeof output !== "object" || output === null || !("ok" in output) || output.ok !== false) return null;
  return "error" in output && typeof output.error === "string" ? output.error : "Unknown error.";
}

function toStep(part: ToolPart): IngestionStep {
  const toolName = part.type.slice("tool-".length);
  const input = (typeof part.input === "object" && part.input !== null ? part.input : {}) as ToolInput;

  if (part.state === "output-error") {
    return { id: part.toolCallId, label: `${describeStep(toolName, input, false)} failed`, state: "failed", detail: part.errorText ?? "Unknown error." };
  }
  if (part.state !== "output-available") {
    return { id: part.toolCallId, label: describeStep(toolName, input, false), state: "running" };
  }
  const error = getOutputError(part.output);
  if (error) return { id: part.toolCallId, label: `${describeStep(toolName, input, false)} failed`, state: "failed", detail: error };
  return { id: part.toolCallId, label: describeStep(toolName, input, true), state: "done" };
}

export function toIngestionEntry(message: IngestionUIMessage): IngestionEntry {
  const blocks: IngestionBlock[] = [];
  for (const part of message.parts) {
    if (part.type === "text" && part.text.trim() !== "") blocks.push({ kind: "text", text: part.text });
    else if (part.type.startsWith("tool-")) blocks.push({ kind: "step", step: toStep(part as ToolPart) });
  }
  return { id: message.id, role: message.role === "user" ? "user" : "assistant", blocks };
}
