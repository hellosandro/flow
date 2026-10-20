CREATE TABLE "inviti" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "space_members" ADD COLUMN "ruolo" text DEFAULT 'membro' NOT NULL;