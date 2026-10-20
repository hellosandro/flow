CREATE TABLE "space_members" (
	"space_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "space_members_space_id_email_pk" PRIMARY KEY("space_id","email")
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "spaces" ("id", "nome") VALUES ('principale', 'Il mio spazio');
--> statement-breakpoint
CREATE TABLE "users" (
	"email" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"foto" text DEFAULT '' NOT NULL,
	"ultimo_accesso" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "space_id" text DEFAULT 'principale' NOT NULL;--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "versione" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "modificato_da" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;