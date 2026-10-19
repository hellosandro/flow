CREATE TABLE "boards" (
	"id" text PRIMARY KEY NOT NULL,
	"titolo" text NOT NULL,
	"posizione" real DEFAULT 0 NOT NULL,
	"vista" text DEFAULT 'essential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_labels" (
	"card_id" text NOT NULL,
	"label_id" text NOT NULL,
	CONSTRAINT "card_labels_card_id_label_id_pk" PRIMARY KEY("card_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "card_members" (
	"card_id" text NOT NULL,
	"membro" text NOT NULL,
	CONSTRAINT "card_members_card_id_membro_pk" PRIMARY KEY("card_id","membro")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"column_id" text NOT NULL,
	"board_id" text NOT NULL,
	"titolo" text NOT NULL,
	"descrizione" text DEFAULT '' NOT NULL,
	"scadenza" date,
	"moduli" text[] DEFAULT '{}' NOT NULL,
	"posizione" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"testo" text NOT NULL,
	"completato" boolean DEFAULT false NOT NULL,
	"posizione" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "columns" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"titolo" text NOT NULL,
	"tipo" text NOT NULL,
	"posizione" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"nome" text NOT NULL,
	"colore" text NOT NULL,
	"posizione" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"url" text NOT NULL,
	"titolo" text DEFAULT '' NOT NULL,
	"posizione" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"autore" text NOT NULL,
	"html" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_members" ADD CONSTRAINT "card_members_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cards_board_idx" ON "cards" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "checklist_card_idx" ON "checklist_items" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "columns_board_idx" ON "columns" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "labels_board_idx" ON "labels" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "links_card_idx" ON "links" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "messages_card_idx" ON "messages" USING btree ("card_id");