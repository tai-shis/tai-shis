CREATE TYPE "public"."ingestion_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."pending_change_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."pending_change_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "ingestion_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "ingestion_message_role" NOT NULL,
	"parts" jsonb NOT NULL,
	"cost_usd" numeric(12, 8),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"source_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"profile_table" text NOT NULL,
	"action" "pending_change_action" NOT NULL,
	"target_row_id" uuid,
	"values" jsonb,
	"reason" text,
	"status" "pending_change_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ingestion_messages" ADD CONSTRAINT "ingestion_messages_session_id_ingestion_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ingestion_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_sessions" ADD CONSTRAINT "ingestion_sessions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_changes" ADD CONSTRAINT "pending_changes_session_id_ingestion_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ingestion_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingestion_messages_session_id_idx" ON "ingestion_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ingestion_messages_created_at_idx" ON "ingestion_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pending_changes_status_idx" ON "pending_changes" USING btree ("status");