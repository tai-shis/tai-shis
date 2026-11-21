import type { UIMessage } from "ai";
import type { ProfileFormValues, ProfileTableKey } from "@/app/lib/profile/tables";

/** Sonnet spend across all ingestion sessions per UTC day, in US dollars. */
export const INGESTION_DAILY_SPEND_CAP_USD = 1;
export const MAX_INGESTION_MESSAGE_CHARS = 20_000;

export type IngestionUIMessage = UIMessage;

export type PendingChangeAction = "create" | "update" | "delete";

/**
 * A proposal waiting for review. `values` are the proposed form values (empty for a delete), and
 * `current` is the row as it is now (null for a create, or when the row has since been deleted).
 */
export type PendingChange = {
  id: string;
  table: ProfileTableKey;
  action: PendingChangeAction;
  values: ProfileFormValues;
  current: ProfileFormValues | null;
  reason: string | null;
};

export type IngestionSessionSummary = { id: string; title: string; createdAt: string };

/** What the propose tools return to the model. */
export type ProposalResult = { ok: true; pendingChangeId: string } | { ok: false; error: string };
