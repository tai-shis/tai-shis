import type { PgTable } from "drizzle-orm/pg-core";
import type {
  education,
  experience,
  facts,
  hobbies,
  projects,
  qa,
  skills,
} from "@/app/lib/db/profile-schema";

export const PROFILE_TABLE_KEYS = ["experience", "education", "projects", "skills", "hobbies", "qa", "facts"] as const;
export type ProfileTableKey = (typeof PROFILE_TABLE_KEYS)[number];

export type ProfileFieldKind = "text" | "multiline" | "url" | "month" | "list";

export type ProfileField<Name extends string = string> = {
  name: Name;
  label: string;
  kind: ProfileFieldKind;
  isRequired?: boolean;
  /** Starts a new row in the two-column form layout instead of filling the next free cell. */
  startsNewRow?: boolean;
};

/** Field values as the form edits them: lists hold one item per line, months are `MM-YYYY`, and empty is "". */
export type ProfileFormValues = Record<string, string>;

export type ProfileRow = {
  id: string;
  visible: boolean;
  values: ProfileFormValues;
};

export type ProfileTableConfig<Name extends string = string> = {
  label: string;
  itemLabel: string;
  fields: ProfileField<Name>[];
  describeRow: (values: ProfileFormValues) => string;
};

export type ProfileMutationResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type ProfileRowActions = {
  create: (table: ProfileTableKey, values: ProfileFormValues) => Promise<ProfileMutationResult>;
  update: (table: ProfileTableKey, id: string, values: ProfileFormValues) => Promise<ProfileMutationResult>;
  remove: (table: ProfileTableKey, id: string) => Promise<ProfileMutationResult>;
  setVisibility: (table: ProfileTableKey, id: string, visible: boolean) => Promise<ProfileMutationResult>;
};

type ColumnName<Table extends PgTable> = Extract<keyof Table["$inferInsert"], string>;

const experienceTable: ProfileTableConfig<ColumnName<typeof experience>> = {
  label: "experience",
  itemLabel: "position",
  fields: [
    { name: "role", label: "title", kind: "text", isRequired: true },
    { name: "company", label: "company", kind: "text", isRequired: true },
    { name: "location", label: "location", kind: "text" },
    { name: "startDate", label: "start date", kind: "month", startsNewRow: true },
    { name: "endDate", label: "end date", kind: "month" },
    { name: "summary", label: "description", kind: "multiline" },
    { name: "highlights", label: "highlights", kind: "list" },
  ],
  describeRow: (values) => `${values.role} @ ${values.company}`,
};

const educationTable: ProfileTableConfig<ColumnName<typeof education>> = {
  label: "education",
  itemLabel: "education",
  fields: [
    { name: "institution", label: "school", kind: "text", isRequired: true },
    { name: "credential", label: "degree", kind: "text", isRequired: true },
    { name: "field", label: "field of study", kind: "text" },
    { name: "startDate", label: "start date", kind: "month", startsNewRow: true },
    { name: "endDate", label: "end date", kind: "month" },
    { name: "gpa", label: "grade", kind: "text", startsNewRow: true },
    { name: "summary", label: "description", kind: "multiline" },
  ],
  describeRow: (values) => `${values.credential}, ${values.institution}`,
};

const projectsTable: ProfileTableConfig<ColumnName<typeof projects>> = {
  label: "projects",
  itemLabel: "project",
  fields: [
    { name: "name", label: "project name", kind: "text", isRequired: true },
    { name: "summary", label: "summary", kind: "text", isRequired: true },
    { name: "startDate", label: "start date", kind: "month", startsNewRow: true },
    { name: "endDate", label: "end date", kind: "month" },
    { name: "description", label: "description", kind: "multiline" },
    { name: "tech", label: "tech stack", kind: "list" },
    { name: "url", label: "project url", kind: "url" },
    { name: "repoUrl", label: "repository url", kind: "url" },
  ],
  describeRow: (values) => values.name,
};

const skillsTable: ProfileTableConfig<ColumnName<typeof skills>> = {
  label: "skills",
  itemLabel: "skill",
  fields: [
    { name: "name", label: "name", kind: "text", isRequired: true },
    { name: "category", label: "category", kind: "text" },
    { name: "notes", label: "notes", kind: "multiline" },
  ],
  describeRow: (values) => (values.category ? `${values.name} (${values.category})` : values.name),
};

const hobbiesTable: ProfileTableConfig<ColumnName<typeof hobbies>> = {
  label: "hobbies",
  itemLabel: "hobby",
  fields: [
    { name: "name", label: "name", kind: "text", isRequired: true },
    { name: "description", label: "description", kind: "multiline", isRequired: true },
  ],
  describeRow: (values) => values.name,
};

const qaTable: ProfileTableConfig<ColumnName<typeof qa>> = {
  label: "grilling",
  itemLabel: "answer",
  fields: [
    { name: "question", label: "question", kind: "multiline", isRequired: true },
    { name: "answer", label: "answer", kind: "multiline", isRequired: true },
    { name: "topic", label: "topic", kind: "text" },
  ],
  describeRow: (values) => values.question,
};

const factsTable: ProfileTableConfig<ColumnName<typeof facts>> = {
  label: "facts",
  itemLabel: "fact",
  fields: [
    { name: "content", label: "content", kind: "multiline", isRequired: true },
    { name: "topic", label: "topic", kind: "text" },
  ],
  describeRow: (values) => values.content,
};

export const profileTables: Record<ProfileTableKey, ProfileTableConfig> = {
  experience: experienceTable,
  education: educationTable,
  projects: projectsTable,
  skills: skillsTable,
  hobbies: hobbiesTable,
  qa: qaTable,
  facts: factsTable,
};

export function getEmptyFormValues(fields: ProfileField[]): ProfileFormValues {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}
