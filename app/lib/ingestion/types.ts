import type { UIMessage } from "ai";
import type { ProfileFormValues, ProfileTableKey } from "@/app/lib/profile/tables";

/** Sonnet spend across all ingestion sessions per UTC day, in US dollars. */
export const INGESTION_DAILY_SPEND_CAP_USD = 1;
export const MAX_INGESTION_MESSAGE_CHARS = 20_000;

// Vercel rejects request bodies over 4.5 MB, so uploads stay under it.
export const MAX_PDF_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_PAGES = 20;
/** Extracted text past this is cut off, and the model is told so. */
export const MAX_PDF_TEXT_CHARS = 40_000;

/** A PDF's extracted text, sent as a `data-pdf` part of Tai's message. The file itself isn't kept. */
export type PdfAttachment = { filename: string; pages: number; text: string; truncated: boolean };

export type IngestionDataTypes = { pdf: PdfAttachment };

export type IngestionUIMessage = UIMessage<unknown, IngestionDataTypes>;

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
