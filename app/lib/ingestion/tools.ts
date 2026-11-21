import { tool } from "ai";
import { z } from "zod";
import { insertPendingChange, listPendingChanges } from "@/app/lib/ingestion/repository";
import type { ProposalResult } from "@/app/lib/ingestion/types";
import { getProfileRow, listProfileRows } from "@/app/lib/profile/repository";
import {
  getEmptyFormValues,
  PROFILE_TABLE_KEYS,
  profileTables,
  type ProfileFormValues,
  type ProfileTableKey,
} from "@/app/lib/profile/tables";
import { parseProfileInput } from "@/app/lib/profile/validation";

const tableSchema = z.enum(PROFILE_TABLE_KEYS).describe("The profile table.");
const valuesSchema = z
  .record(z.string(), z.string())
  .describe("Field name to value. Months are MM-YYYY. List fields hold one item per line.");
const reasonSchema = z.string().max(500).describe("One sentence on why, quoting what Tai said when you can.");

function dropEmpty(values: ProfileFormValues): ProfileFormValues {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
}

function fail(error: string): ProposalResult {
  return { ok: false, error };
}

function findUnknownFields(table: ProfileTableKey, values: ProfileFormValues): string[] {
  const known = new Set(profileTables[table].fields.map((field) => field.name));
  return Object.keys(values).filter((name) => !known.has(name));
}

/** Checks the values the same way the admin form does, so an approved proposal always saves. */
function checkValues(table: ProfileTableKey, values: ProfileFormValues): string | null {
  const unknown = findUnknownFields(table, values);
  if (unknown.length > 0) {
    const fieldNames = profileTables[table].fields.map((field) => field.name).join(", ");
    return `Unknown fields for ${table}: ${unknown.join(", ")}. Use only: ${fieldNames}.`;
  }
  const parsed = parseProfileInput(table, values);
  if (parsed.ok) return null;
  return Object.entries(parsed.fieldErrors)
    .map(([name, message]) => `${name}: ${message}`)
    .join(" ");
}

/** Tools for one ingestion session. They only ever propose: Tai approves every change. */
export function createIngestionTools(sessionId: string) {
  return {
    list_profile: tool({
      description:
        "List every row in a profile table, private rows (visible: false, kept from the public chat) included, plus proposals still waiting for Tai's review. Call this before proposing anything for a table, so you edit existing rows instead of adding duplicates.",
      inputSchema: z.object({ table: tableSchema }),
      execute: async ({ table }) => {
        const [rows, pending] = await Promise.all([listProfileRows(table), listPendingChanges()]);
        return {
          rows: rows.map((row) => ({ id: row.id, visible: row.visible, values: dropEmpty(row.values) })),
          waitingForReview: pending
            .filter((change) => change.table === table)
            .map((change) => ({ action: change.action, values: dropEmpty(change.values), reason: change.reason })),
        };
      },
    }),

    propose_create: tool({
      description: "Propose a new profile row. Tai reviews it before it is saved.",
      inputSchema: z.object({ table: tableSchema, values: valuesSchema, reason: reasonSchema }),
      execute: async ({ table, values, reason }): Promise<ProposalResult> => {
        const proposed = { ...getEmptyFormValues(profileTables[table].fields), ...values };
        const error = checkValues(table, proposed);
        if (error) return fail(error);
        const pendingChangeId = await insertPendingChange({ sessionId, table, action: "create", values: proposed, reason });
        return { ok: true, pendingChangeId };
      },
    }),

    propose_update: tool({
      description:
        "Propose changes to an existing profile row. Pass only the fields that change; the rest keep their current values.",
      inputSchema: z.object({ table: tableSchema, rowId: z.uuid(), values: valuesSchema, reason: reasonSchema }),
      execute: async ({ table, rowId, values, reason }): Promise<ProposalResult> => {
        const row = await getProfileRow(table, rowId);
        if (!row) return fail(`No ${table} row has id ${rowId}. Call list_profile for current ids.`);
        const proposed = { ...row.values, ...values };
        const error = checkValues(table, proposed);
        if (error) return fail(error);
        const changesSomething = Object.keys(proposed).some((name) => proposed[name] !== row.values[name]);
        if (!changesSomething) return fail("Those values match the row already. Nothing to propose.");
        const pendingChangeId = await insertPendingChange({ sessionId, table, action: "update", targetRowId: rowId, values: proposed, reason });
        return { ok: true, pendingChangeId };
      },
    }),

    propose_delete: tool({
      description: "Propose removing a profile row, for example one that is wrong or duplicated.",
      inputSchema: z.object({ table: tableSchema, rowId: z.uuid(), reason: reasonSchema }),
      execute: async ({ table, rowId, reason }): Promise<ProposalResult> => {
        const row = await getProfileRow(table, rowId);
        if (!row) return fail(`No ${table} row has id ${rowId}. Call list_profile for current ids.`);
        const pendingChangeId = await insertPendingChange({ sessionId, table, action: "delete", targetRowId: rowId, reason });
        return { ok: true, pendingChangeId };
      },
    }),
  };
}

export type IngestionTools = ReturnType<typeof createIngestionTools>;
