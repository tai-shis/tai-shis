import { desc, eq } from "drizzle-orm";
import { db } from "@/app/lib/db";
import {
  education,
  experience,
  facts,
  hobbies,
  projects,
  qa,
  skills,
} from "@/app/lib/db/profile-schema";
import {
  PROFILE_TABLE_KEYS,
  profileTables,
  type ProfileField,
  type ProfileRow,
  type ProfileTableKey,
} from "@/app/lib/profile/tables";
import type { ProfileColumnValues } from "@/app/lib/profile/validation";

const profileDbTables = { experience, education, projects, skills, hobbies, qa, facts };

// The tables differ only in their content columns, and content values are checked against the
// table's own field list before they get here, so one table's type stands in for all of them.
function getDbTable(table: ProfileTableKey) {
  return profileDbTables[table] as typeof facts;
}

/** `2025-05-01` (a Postgres date) becomes `05-2025`. */
function toMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  return `${month}-${year}`;
}

function toFormValue(field: ProfileField, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (field.kind === "list") return (value as string[]).join("\n");
  if (field.kind === "month") return toMonthYear(String(value));
  return String(value);
}

function toProfileRow(row: Record<string, unknown> & { id: string; visible: boolean }, fields: ProfileField[]): ProfileRow {
  return {
    id: row.id,
    visible: row.visible,
    values: Object.fromEntries(fields.map((field) => [field.name, toFormValue(field, row[field.name])])),
  };
}

export async function listProfileRows(table: ProfileTableKey): Promise<ProfileRow[]> {
  const dbTable = getDbTable(table);
  const rows = await db.select().from(dbTable).orderBy(desc(dbTable.createdAt));
  return rows.map((row) => toProfileRow(row, profileTables[table].fields));
}

export async function listAllProfileRows(): Promise<Record<ProfileTableKey, ProfileRow[]>> {
  const rowLists = await Promise.all(PROFILE_TABLE_KEYS.map(listProfileRows));
  return Object.fromEntries(PROFILE_TABLE_KEYS.map((table, i) => [table, rowLists[i]])) as Record<ProfileTableKey, ProfileRow[]>;
}

export async function insertProfileRow(table: ProfileTableKey, values: ProfileColumnValues): Promise<void> {
  await db.insert(getDbTable(table)).values(values as unknown as typeof facts.$inferInsert);
}

/** Each update resolves to false when no row has the id. */
export async function updateProfileRow(table: ProfileTableKey, id: string, values: ProfileColumnValues): Promise<boolean> {
  const dbTable = getDbTable(table);
  const updated = await db
    .update(dbTable)
    .set(values as Partial<typeof facts.$inferInsert>)
    .where(eq(dbTable.id, id))
    .returning({ id: dbTable.id });
  return updated.length > 0;
}

export async function setProfileRowVisibility(table: ProfileTableKey, id: string, visible: boolean): Promise<boolean> {
  const dbTable = getDbTable(table);
  const updated = await db.update(dbTable).set({ visible }).where(eq(dbTable.id, id)).returning({ id: dbTable.id });
  return updated.length > 0;
}

export async function deleteProfileRow(table: ProfileTableKey, id: string): Promise<boolean> {
  const dbTable = getDbTable(table);
  const deleted = await db.delete(dbTable).where(eq(dbTable.id, id)).returning({ id: dbTable.id });
  return deleted.length > 0;
}
