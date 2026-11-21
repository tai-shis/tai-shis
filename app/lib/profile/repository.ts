import { asc, desc, eq, sql } from "drizzle-orm";
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
  type ProfileFormValues,
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

export async function getProfileRow(table: ProfileTableKey, id: string): Promise<ProfileRow | null> {
  const dbTable = getDbTable(table);
  const [row] = await db.select().from(dbTable).where(eq(dbTable.id, id));
  return row ? toProfileRow(row, profileTables[table].fields) : null;
}

export async function listAllProfileRows(): Promise<Record<ProfileTableKey, ProfileRow[]>> {
  const rowLists = await Promise.all(PROFILE_TABLE_KEYS.map(listProfileRows));
  return Object.fromEntries(PROFILE_TABLE_KEYS.map((table, i) => [table, rowLists[i]])) as Record<ProfileTableKey, ProfileRow[]>;
}

/** Oldest first, so the order (and the cached chat prompt built from it) only changes when rows do. */
export async function listVisibleProfileValues(table: ProfileTableKey): Promise<ProfileFormValues[]> {
  const dbTable = getDbTable(table);
  const rows = await db.select().from(dbTable).where(eq(dbTable.visible, true)).orderBy(asc(dbTable.createdAt));
  return rows.map((row) => toProfileRow(row, profileTables[table].fields).values);
}

export type ProfileNoteMatch = { source: "qa" | "facts"; text: string };

/**
 * Full-text search over visible grilling answers and facts. Any query word can match, and
 * results come back best match first.
 */
export async function searchVisibleProfileNotes(query: string, limit: number): Promise<ProfileNoteMatch[]> {
  // plainto_tsquery ignores search operators and joins words with AND, which misses notes that use
  // only some of them, so the ANDs become ORs.
  const { rows } = await db.execute<ProfileNoteMatch & { rank: number }>(sql`
    with q as (select replace(plainto_tsquery('english', ${query})::text, ' & ', ' | ')::tsquery as query)
    select source, text, rank from (
      select 'qa' as source, question || E'\n' || answer as text,
        ts_rank(to_tsvector('english', coalesce(topic, '') || ' ' || question || ' ' || answer), q.query) as rank
      from qa, q
      where visible and to_tsvector('english', coalesce(topic, '') || ' ' || question || ' ' || answer) @@ q.query
      union all
      select 'facts' as source, content as text,
        ts_rank(to_tsvector('english', coalesce(topic, '') || ' ' || content), q.query) as rank
      from facts, q
      where visible and to_tsvector('english', coalesce(topic, '') || ' ' || content) @@ q.query
    ) matches
    order by rank desc
    limit ${limit}
  `);
  return rows.map(({ source, text }) => ({ source, text }));
}

/** `sourceId` records where the row came from, such as the ingestion session that proposed it. */
export async function insertProfileRow(table: ProfileTableKey, values: ProfileColumnValues, sourceId?: string | null): Promise<void> {
  await db.insert(getDbTable(table)).values({ ...values, sourceId } as unknown as typeof facts.$inferInsert);
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
