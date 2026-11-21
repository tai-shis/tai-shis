"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/app/lib/auth-guard";
import {
  claimPendingChange,
  getSessionSourceId,
  listIngestionMessages,
  listSessionChanges,
  rejectPendingChanges,
  releasePendingChange,
  type ClaimedPendingChange,
} from "@/app/lib/ingestion/repository";
import type { IngestionUIMessage, PendingChange } from "@/app/lib/ingestion/types";
import { deleteProfileRow, insertProfileRow, updateProfileRow } from "@/app/lib/profile/repository";
import type { ProfileMutationResult } from "@/app/lib/profile/tables";
import { parseProfileInput } from "@/app/lib/profile/validation";

const ADMIN_PATH = "/admin";
const idSchema = z.uuid();

const NOT_ADMIN = { ok: false, error: "Only admins can review proposals." } as const;
const BAD_REQUEST = { ok: false, error: "That request was not valid. Reload the page and try again." } as const;
const ALREADY_HANDLED: ProfileMutationResult = { ok: false, error: "This proposal was already handled. Reload the page." };
const ROW_MISSING: ProfileMutationResult = { ok: false, error: "The entry this changes no longer exists. Reject the proposal instead." };
const SAVE_FAILED: ProfileMutationResult = { ok: false, error: "Unable to save the change. Try again." };

/** Writes an approved change to the profile. `editedValues` replace the proposed values when Tai edited them. */
async function applyChange(change: ClaimedPendingChange, editedValues: unknown): Promise<ProfileMutationResult> {
  if (change.action === "delete") {
    // Already gone is the outcome the proposal asked for.
    if (change.targetRowId) await deleteProfileRow(change.table, change.targetRowId);
    return { ok: true };
  }

  const parsed = parseProfileInput(change.table, editedValues ?? change.values);
  if (!parsed.ok) return { ok: false, error: "Fix the highlighted fields.", fieldErrors: parsed.fieldErrors };

  if (change.action === "create") {
    await insertProfileRow(change.table, parsed.values, await getSessionSourceId(change.sessionId));
    return { ok: true };
  }
  if (!change.targetRowId) return ROW_MISSING;
  return (await updateProfileRow(change.table, change.targetRowId, parsed.values)) ? { ok: true } : ROW_MISSING;
}

export async function approvePendingChange(id: string, editedValues?: unknown): Promise<ProfileMutationResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success) return BAD_REQUEST;
  const result = await approveOne(id, editedValues);
  if (result.ok) revalidatePath(ADMIN_PATH);
  return result;
}

/** Claims and applies one change. The caller checks the id and refreshes the page. */
async function approveOne(id: string, editedValues?: unknown): Promise<ProfileMutationResult> {
  // Claiming first means a double click can't apply the same change twice.
  const change = await claimPendingChange(id, "approved");
  if (!change) return ALREADY_HANDLED;
  try {
    const result = await applyChange(change, editedValues);
    if (!result.ok) await releasePendingChange(id);
    return result;
  } catch (error) {
    console.error("Approving a proposal failed", error);
    await releasePendingChange(id);
    return SAVE_FAILED;
  }
}

export async function rejectPendingChange(id: string): Promise<ProfileMutationResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success) return BAD_REQUEST;
  try {
    if (!(await claimPendingChange(id, "rejected"))) return ALREADY_HANDLED;
    revalidatePath(ADMIN_PATH);
    return { ok: true };
  } catch (error) {
    console.error("Rejecting a proposal failed", error);
    return SAVE_FAILED;
  }
}

// One session's worth of proposals. More than this means something else went wrong.
const idsSchema = z.array(z.uuid()).min(1).max(500);

/**
 * Approves the given proposals one by one, oldest first, as they were proposed. Any that can't
 * be saved stay pending for Tai to fix or reject, and the result says how many.
 */
export async function approveAllPendingChanges(ids: string[]): Promise<ProfileMutationResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return BAD_REQUEST;

  let failed = 0;
  for (const id of parsed.data) {
    const result = await approveOne(id);
    // Already handled elsewhere isn't a failure: there's nothing left to do for it.
    if (!result.ok && result !== ALREADY_HANDLED) failed++;
  }
  revalidatePath(ADMIN_PATH);
  if (failed === 0) return { ok: true };
  const saved = parsed.data.length - failed;
  return {
    ok: false,
    error: `Approved ${saved} of ${parsed.data.length}. The ${failed === 1 ? "one left couldn't" : `${failed} left couldn't`} be saved: approve ${failed === 1 ? "it" : "them"} one at a time to see why, or reject ${failed === 1 ? "it" : "them"}.`,
  };
}

/** Rejects all the given proposals that are still pending. Ones already reviewed are skipped. */
export async function rejectAllPendingChanges(ids: string[]): Promise<ProfileMutationResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return BAD_REQUEST;
  try {
    await rejectPendingChanges(parsed.data);
    revalidatePath(ADMIN_PATH);
    return { ok: true };
  } catch (error) {
    console.error("Rejecting proposals failed", error);
    return SAVE_FAILED;
  }
}

export type LoadSessionResult =
  | { ok: true; messages: IngestionUIMessage[]; changes: PendingChange[] }
  | { ok: false; error: string };

export async function loadIngestionSession(sessionId: string): Promise<LoadSessionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  if (!idSchema.safeParse(sessionId).success) return BAD_REQUEST;
  try {
    const [messages, changes] = await Promise.all([listIngestionMessages(sessionId), listSessionChanges(sessionId)]);
    return { ok: true, messages, changes };
  } catch (error) {
    console.error("Loading an ingestion session failed", error);
    return { ok: false, error: "Unable to open that session. Try again." };
  }
}

export type LoadChangesResult = { ok: true; changes: PendingChange[] } | { ok: false; error: string };

/** The session's proposals, reloaded after each reply so new ones show up in the chat. */
export async function loadSessionChanges(sessionId: string): Promise<LoadChangesResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  if (!idSchema.safeParse(sessionId).success) return BAD_REQUEST;
  try {
    return { ok: true, changes: await listSessionChanges(sessionId) };
  } catch (error) {
    console.error("Loading proposals failed", error);
    return { ok: false, error: "Unable to load the proposals. Reload the page." };
  }
}
