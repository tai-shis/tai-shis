import { z } from "zod";
import { profileTables, type ProfileField, type ProfileTableKey } from "@/app/lib/profile/tables";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type ProfileColumnValue = string | string[] | null;
export type ProfileColumnValues = Record<string, ProfileColumnValue>;

export type ProfileInputParseResult =
  | { ok: true; values: ProfileColumnValues }
  | { ok: false; fieldErrors: Record<string, string> };

function toNullIfEmpty(value: string): string | null {
  return value === "" ? null : value;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildTextSchema(field: ProfileField) {
  const text = z.string().trim();
  return field.isRequired ? text.refine((value) => value !== "", `Enter a ${field.label}.`) : text;
}

function buildFieldSchema(field: ProfileField) {
  switch (field.kind) {
    case "list":
      return z.string().transform(splitLines);
    case "month":
      return buildTextSchema(field)
        .refine((value) => value === "" || MONTH_PATTERN.test(value), "Use the format YYYY-MM.")
        .transform((value) => (value === "" ? null : `${value}-01`));
    case "url":
      return buildTextSchema(field)
        .refine((value) => value === "" || isHttpUrl(value), "Enter a full URL, starting with https://.")
        .transform(toNullIfEmpty);
    case "text":
    case "multiline":
      return buildTextSchema(field).transform(toNullIfEmpty);
  }
}

/** Unknown keys are dropped, so form input can only reach the columns listed in the table's fields. */
export function parseProfileInput(table: ProfileTableKey, input: unknown): ProfileInputParseResult {
  const { fields } = profileTables[table];
  const schema = z.object(Object.fromEntries(fields.map((field) => [field.name, buildFieldSchema(field)])));
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, values: result.data as ProfileColumnValues };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const fieldName = String(issue.path[0] ?? "");
    fieldErrors[fieldName] ??= issue.message;
  }
  return { ok: false, fieldErrors };
}
