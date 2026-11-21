import { boolean, date, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const sourceKind = pgEnum("source_kind", ["pdf", "chat", "manual"]);

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: sourceKind("kind").notNull(),
  title: text("title").notNull(),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const profileRowColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  visible: boolean("visible").default(true).notNull(),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// Dates have month precision: stored as the first of the month.
const dateRangeColumns = {
  startDate: date("start_date"),
  endDate: date("end_date"),
};

export const experience = pgTable("experience", {
  ...profileRowColumns,
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location"),
  ...dateRangeColumns,
  summary: text("summary"),
  highlights: text("highlights").array().default([]).notNull(),
});

export const education = pgTable("education", {
  ...profileRowColumns,
  institution: text("institution").notNull(),
  credential: text("credential").notNull(),
  field: text("field"),
  ...dateRangeColumns,
  gpa: text("gpa"),
  summary: text("summary"),
});

export const projects = pgTable("projects", {
  ...profileRowColumns,
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  tech: text("tech").array().default([]).notNull(),
  url: text("url"),
  repoUrl: text("repo_url"),
  ...dateRangeColumns,
});

export const skills = pgTable("skills", {
  ...profileRowColumns,
  name: text("name").notNull(),
  category: text("category"),
  notes: text("notes"),
});

export const hobbies = pgTable("hobbies", {
  ...profileRowColumns,
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const qa = pgTable("qa", {
  ...profileRowColumns,
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  topic: text("topic"),
});

export const facts = pgTable("facts", {
  ...profileRowColumns,
  topic: text("topic"),
  content: text("content").notNull(),
});
