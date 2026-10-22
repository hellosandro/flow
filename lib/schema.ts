import { pgTable, text, real, boolean, date, timestamp, integer, primaryKey, index } from 'drizzle-orm/pg-core';

/* Modello dati della sezione 6 di claude.md. Gli id li genera il client, così l'interfaccia
   può aggiornarsi subito e salvare in background. Eliminando una bacheca si elimina tutto a cascata. */

/* Uno spazio raccoglie le bacheche di un gruppo di persone: chi è nello spazio le vede tutte */
export const spaces = pgTable('spaces', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

/* Persone di uno spazio, per email (l'account Google con cui entrano).
   Il proprietario gestisce lo spazio: nome, inviti, ruoli. */
export const spaceMembers = pgTable('space_members', {
  spaceId: text('space_id').notNull().references(() => spaces.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  ruolo: text('ruolo').notNull().default('membro'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [primaryKey({ columns: [t.spaceId, t.email] })]);

/* Inviti a Flow: chi è in questo elenco può entrare e aprire il suo studio */
export const inviti = pgTable('inviti', {
  email: text('email').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

/* Nome e foto di chi è entrato almeno una volta, per firmare messaggi e membri */
export const users = pgTable('users', {
  email: text('email').primaryKey(),
  nome: text('nome').notNull(),
  foto: text('foto').notNull().default(''),
  ultimoAccesso: timestamp('ultimo_accesso', { withTimezone: true }).notNull().defaultNow()
});

export const boards = pgTable('boards', {
  id: text('id').primaryKey(),
  spaceId: text('space_id').notNull().default('principale').references(() => spaces.id, { onDelete: 'cascade' }),
  titolo: text('titolo').notNull(),
  /* cresce a ogni salvataggio: se due persone salvano insieme, la seconda se ne accorge */
  versione: integer('versione').notNull().default(0),
  modificatoDa: text('modificato_da').notNull().default(''),
  posizione: real('posizione').notNull().default(0),
  vista: text('vista').notNull().default('essential'),
  colore: integer('colore'),
  /* periodo del cantiere, per il Planning (facoltativo) */
  inizio: date('inizio'),
  fine: date('fine'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const columns = pgTable('columns', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  titolo: text('titolo').notNull(),
  tipo: text('tipo').notNull(),
  posizione: real('posizione').notNull()
}, t => [index('columns_board_idx').on(t.boardId)]);

export const labels = pgTable('labels', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  colore: text('colore').notNull(),
  posizione: real('posizione').notNull().default(0)
}, t => [index('labels_board_idx').on(t.boardId)]);

export const cards = pgTable('cards', {
  id: text('id').primaryKey(),
  columnId: text('column_id').notNull().references(() => columns.id, { onDelete: 'cascade' }),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  titolo: text('titolo').notNull(),
  descrizione: text('descrizione').notNull().default(''),
  /* la scadenza è la Fine; l'Inizio è facoltativo e serve al Planning */
  inizio: date('inizio'),
  scadenza: date('scadenza'),
  moduli: text('moduli').array().notNull().default([]),
  colore: integer('colore'),
  posizione: real('posizione').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('cards_board_idx').on(t.boardId)]);

export const cardLabels = pgTable('card_labels', {
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' })
}, t => [primaryKey({ columns: [t.cardId, t.labelId] })]);

export const cardMembers = pgTable('card_members', {
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  membro: text('membro').notNull()
}, t => [primaryKey({ columns: [t.cardId, t.membro] })]);

export const checklistItems = pgTable('checklist_items', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  testo: text('testo').notNull(),
  completato: boolean('completato').notNull().default(false),
  posizione: real('posizione').notNull()
}, t => [index('checklist_card_idx').on(t.cardId)]);

export const links = pgTable('links', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  titolo: text('titolo').notNull().default(''),
  posizione: real('posizione').notNull()
}, t => [index('links_card_idx').on(t.cardId)]);

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  autore: text('autore').notNull(),
  html: text('html').notNull(),
  modificato: boolean('modificato').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('messages_card_idx').on(t.cardId)]);
