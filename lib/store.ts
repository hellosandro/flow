import { asc, eq } from 'drizzle-orm';
import { getDb } from './db';
import * as t from './schema';

/* Forma dei dati usata dall'interfaccia (ui/flow.html). Il server la scompone nelle tabelle
   e la ricompone in lettura: l'interfaccia salva una bacheca intera alla volta. */
export type UiCard = {
  id: string; col: string; title: string; notes: string; due: string | null;
  labels: string[]; members: string[]; modules: string[];
  checklist: { id: string; text: string; done: boolean }[];
  links: { id: string; url: string; title: string }[];
  messages: { id: string; me: boolean; name: string; html: string; at: number; edited?: boolean }[];
  createdAt?: number;
};
export type UiBoard = {
  id: string; title: string; view: string; created: string;
  labels: { id: string; name: string; color: string }[];
  columns: { id: string; title: string; type: string }[];
  cards: UiCard[];
};

const ME = 'p-io';
export const PEOPLE = [{ id: ME, name: 'Io', role: 'Proprietario', initials: 'IO', me: true }];

const str = (v: unknown, max = 200_000) => (typeof v === 'string' ? v : '').slice(0, max);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? v : []);
const isDay = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function loadAll() {
  const db = getDb();
  const [bs, cols, labs, cs, cls, cms, items, lks, msgs] = await Promise.all([
    db.select().from(t.boards).orderBy(asc(t.boards.posizione), asc(t.boards.createdAt)),
    db.select().from(t.columns).orderBy(asc(t.columns.posizione)),
    db.select().from(t.labels).orderBy(asc(t.labels.posizione)),
    db.select().from(t.cards).orderBy(asc(t.cards.posizione)),
    db.select().from(t.cardLabels),
    db.select().from(t.cardMembers),
    db.select().from(t.checklistItems).orderBy(asc(t.checklistItems.posizione)),
    db.select().from(t.links).orderBy(asc(t.links.posizione)),
    db.select().from(t.messages).orderBy(asc(t.messages.createdAt))
  ]);
  const group = <R, K extends keyof R>(rows: R[], key: K) => {
    const m = new Map<unknown, R[]>();
    for (const r of rows) { const k = r[key]; if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
    return (k: unknown) => m.get(k) || [];
  };
  const colsOf = group(cols, 'boardId'), labsOf = group(labs, 'boardId'), cardsOf = group(cs, 'boardId');
  const clOf = group(cls, 'cardId'), cmOf = group(cms, 'cardId'), itemsOf = group(items, 'cardId');
  const linksOf = group(lks, 'cardId'), msgsOf = group(msgs, 'cardId');

  return bs.map(b => ({
    id: b.id, title: b.titolo, view: b.vista, created: b.createdAt.toISOString().slice(0, 10),
    people: PEOPLE,
    labels: labsOf(b.id).map(l => ({ id: l.id, name: l.nome, color: l.colore })),
    columns: colsOf(b.id).map(c => ({ id: c.id, title: c.titolo, type: c.tipo })),
    cards: cardsOf(b.id).map(c => ({
      id: c.id, col: c.columnId, title: c.titolo, notes: c.descrizione, due: c.scadenza,
      modules: c.moduli, createdAt: c.createdAt.getTime(),
      labels: clOf(c.id).map(x => x.labelId),
      members: cmOf(c.id).map(x => x.membro),
      checklist: itemsOf(c.id).map(i => ({ id: i.id, text: i.testo, done: i.completato })),
      links: linksOf(c.id).map(l => ({ id: l.id, url: l.url, title: l.titolo })),
      messages: msgsOf(c.id).map(m => ({ id: m.id, me: m.autore === ME, name: m.autore === ME ? 'Io' : m.autore, html: m.html, at: m.createdAt.getTime(), edited: m.modificato }))
    }))
  }));
}

/* Salvataggio di una bacheca: in una sola transazione si cancella la versione precedente
   (a cascata) e si scrive quella nuova. Se qualcosa va storto non cambia niente. */
export async function saveBoard(id: string, input: UiBoard, posizione: number) {
  const db = getDb();
  const now = new Date();
  const cols = arr<UiBoard['columns'][number]>(input.columns).filter(c => c && c.id);
  const colIds = new Set(cols.map(c => c.id));
  const labs = arr<UiBoard['labels'][number]>(input.labels).filter(l => l && l.id);
  const labIds = new Set(labs.map(l => l.id));
  const cs = arr<UiCard>(input.cards).filter(c => c && c.id && colIds.has(c.col));

  await db.transaction(async tx => {
    await tx.delete(t.boards).where(eq(t.boards.id, id));
    await tx.insert(t.boards).values({
      id, titolo: str(input.title, 500) || 'Senza titolo', posizione, vista: input.view === 'full' ? 'full' : 'essential',
      createdAt: isDay(input.created) ? new Date(input.created + 'T12:00:00Z') : now
    });
    if (cols.length) await tx.insert(t.columns).values(cols.map((c, i) => ({ id: c.id, boardId: id, titolo: str(c.title, 500) || 'Senza titolo', tipo: str(c.type, 40) || 'variabile', posizione: i })));
    if (labs.length) await tx.insert(t.labels).values(labs.map((l, i) => ({ id: l.id, boardId: id, nome: str(l.name, 200), colore: str(l.color, 60), posizione: i })));
    if (!cs.length) return;
    await tx.insert(t.cards).values(cs.map((c, i) => ({
      id: c.id, columnId: c.col, boardId: id, titolo: str(c.title, 2000) || 'Senza titolo', descrizione: str(c.notes),
      scadenza: isDay(c.due) ? c.due : null, moduli: arr<string>(c.modules).map(m => str(m, 40)),
      posizione: i, createdAt: typeof c.createdAt === 'number' ? new Date(c.createdAt) : now, updatedAt: now
    })));
    const cl = cs.flatMap(c => [...new Set(arr<string>(c.labels))].filter(l => labIds.has(l)).map(labelId => ({ cardId: c.id, labelId })));
    if (cl.length) await tx.insert(t.cardLabels).values(cl);
    const cm = cs.flatMap(c => [...new Set(arr<string>(c.members))].map(m => ({ cardId: c.id, membro: str(m, 100) })));
    if (cm.length) await tx.insert(t.cardMembers).values(cm);
    const items = cs.flatMap(c => arr<UiCard['checklist'][number]>(c.checklist).filter(i => i && i.id).map((i, n) => ({ id: i.id, cardId: c.id, testo: str(i.text, 5000), completato: !!i.done, posizione: n })));
    if (items.length) await tx.insert(t.checklistItems).values(items);
    const lks = cs.flatMap(c => arr<UiCard['links'][number]>(c.links).filter(l => l && l.id).map((l, n) => ({ id: l.id, cardId: c.id, url: str(l.url, 4000), titolo: str(l.title, 500), posizione: n })));
    if (lks.length) await tx.insert(t.links).values(lks);
    const msgs = cs.flatMap(c => arr<UiCard['messages'][number]>(c.messages).filter(m => m && m.id).map(m => ({ id: m.id, cardId: c.id, autore: m.me ? ME : str(m.name, 200), html: str(m.html), modificato: !!m.edited, createdAt: typeof m.at === 'number' ? new Date(m.at) : now })));
    if (msgs.length) await tx.insert(t.messages).values(msgs);
  });
}

export async function deleteBoard(id: string) {
  await getDb().delete(t.boards).where(eq(t.boards.id, id));
}
