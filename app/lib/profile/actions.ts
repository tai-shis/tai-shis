"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import {
  deleteProfileRow,
  insertProfileRow,
  setProfileRowVisibility,
  updateProfileRow,
} from "@/app/lib/profile/repository";
import { PROFILE_TABLE_KEYS, type ProfileMutationResult, type ProfileTableKey } from "@/app/lib/profile/tables";
import { parseProfileInput } from "@/app/lib/profile/validation";

const ADMIN_PATH = "/admin";
const tableKeySchema = z.enum(PROFILE_TABLE_KEYS);
const rowIdSchema = z.uuid();

const NOT_ADMIN: ProfileMutationResult = { ok: false, error: "Only admins can edit the profile." };
const BAD_REQUEST: ProfileMutationResult = { ok: false, error: "That request was not valid. Reload the page and try again." };
const ROW_MISSING: ProfileMutationResult = { ok: false, error: "This entry no longer exists. Reload the page." };
const SAVE_FAILED: ProfileMutationResult = { ok: false, error: "Unable to save the change. Try again." };

async function isAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}

function isValidTarget(table: unknown, id?: unknown): table is ProfileTableKey {
  if (!tableKeySchema.safeParse(table).success) return false;
  return id === undefined || rowIdSchema.safeParse(id).success;
}

/** Server functions are reachable by direct POST, so each one checks the role before touching data. */
async function runAdminMutation(mutate: () => Promise<ProfileMutationResult>): Promise<ProfileMutationResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  try {
    const result = await mutate();
    if (result.ok) revalidatePath(ADMIN_PATH);
    return result;
  } catch (error) {
    console.error("Profile mutation failed", error);
    return SAVE_FAILED;
  }
}

function toRowResult(wasFound: boolean): ProfileMutationResult {
  return wasFound ? { ok: true } : ROW_MISSING;
}

export async function createProfileRow(table: ProfileTableKey, input: unknown): Promise<ProfileMutationResult> {
  return runAdminMutation(async () => {
    if (!isValidTarget(table)) return BAD_REQUEST;
    const parsed = parseProfileInput(table, input);
    if (!parsed.ok) return { ok: false, error: "Fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
    await insertProfileRow(table, parsed.values);
    return { ok: true };
  });
}

export async function updateProfileRowValues(table: ProfileTableKey, id: string, input: unknown): Promise<ProfileMutationResult> {
  return runAdminMutation(async () => {
    if (!isValidTarget(table, id)) return BAD_REQUEST;
    const parsed = parseProfileInput(table, input);
    if (!parsed.ok) return { ok: false, error: "Fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
    return toRowResult(await updateProfileRow(table, id, parsed.values));
  });
}

export async function changeProfileRowVisibility(table: ProfileTableKey, id: string, visible: boolean): Promise<ProfileMutationResult> {
  return runAdminMutation(async () => {
    if (!isValidTarget(table, id) || typeof visible !== "boolean") return BAD_REQUEST;
    return toRowResult(await setProfileRowVisibility(table, id, visible));
  });
}

export async function removeProfileRow(table: ProfileTableKey, id: string): Promise<ProfileMutationResult> {
  return runAdminMutation(async () => {
    if (!isValidTarget(table, id)) return BAD_REQUEST;
    return toRowResult(await deleteProfileRow(table, id));
  });
}
