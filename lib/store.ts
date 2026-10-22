import { and, asc, eq, inArray } from 'drizzle-orm';
import { getDb } from './db';
import { admins, isAdmin, type SessionUser } from './auth';
import { sanitizeHtml } from './sanitize';
import * as t from './schema';

/* Forma dei dati usata dall'interfaccia (ui/flow.html). Il server la scompone nelle tabelle
   e la ricompone in lettura: l'interfaccia salva una bacheca intera alla volta. */
export type UiCard = {
  id: string; col: string; title: string; notes: string; due: string | null;
  labels: string[]; members: string[]; modules: string[]; color?: number | null;
  checklist: { id: string; text: string; done: boolean }[];
  links: { id: string; url: string; title: string }[];
  messages: { id: string; me: boolean; name: string; html: string; at: number; edited?: boolean }[];
  createdAt?: number;
};
export type UiBoard = {
  id: string; title: string; view: string; created: string; color?: number | null; space?: string; version?: number;
  labels: { id: string; name: string; color: string }[];
  columns: { id: string; title: string; type: string }[];
  cards: UiCard[];
};

/* Prima del login con Google c'era un solo utente, "p-io": i suoi messaggi e le sue
   assegnazioni diventano del primo amministratore */
const OLD_ME = 'p-io';
const owner = (who: string) => (who === OLD_ME ? admins()[0] || who : who);

export type Person = { email: string; name: string; picture: string };
export type Role = 'proprietario' | 'membro';
export type UiSpace = { id: string; name: string; role: Role; people: Person[]; members: { email: string; role: Role }[] };

const str = (v: unknown, max = 200_000) => (typeof v === 'string' ? v : '').slice(0, max);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? v : []);
/* Tutto ciò che l'interfaccia inserisce nella pagina senza passare dal testo va controllato qui:
   identificativi, colori delle etichette, tipi, moduli e indirizzi dei link */
const isId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v);
const safeColor = (v: unknown) => (typeof v === 'string' && /^(var\(--[a-z0-9-]+\)|#[0-9a-fA-F]{3,8})$/.test(v) ? v : 'var(--blue)');
const safeUrl = (v: unknown) => {
  const u = str(v, 4000).trim();
  return /^(https?:\/\/|mailto:)/i.test(u) ? u : 'https://' + u.replace(/^[a-z][a-z0-9+.-]*:\/*/i, '');
};
const isEmail = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(v);
const isDay = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/* Chi può entrare: l'amministratore, chi ha un invito a Flow e chi è stato invitato in uno spazio */
export async function canEnter(email: string) {
  if (isAdmin(email)) return true;
  const db = getDb();
  const [m, i] = await Promise.all([
    db.select().from(t.spaceMembers).where(eq(t.spaceMembers.email, email)).limit(1),
    db.select().from(t.inviti).where(eq(t.inviti.email, email)).limit(1)
  ]);
  return m.length > 0 || i.length > 0;
}

export async function rememberUser(u: SessionUser) {
  await getDb().insert(t.users).values({ email: u.email, nome: u.name, foto: u.picture, ultimoAccesso: new Date() })
    .onConflictDoUpdate({ target: t.users.email, set: { nome: u.name, foto: u.picture, ultimoAccesso: new Date() } });
}

/* Al primo ingresso ognuno trova il suo studio, di cui è proprietario.
   Gli spazi senza proprietario (quelli nati prima dei ruoli) passano all'amministratore. */
export async function ensureHome(user: SessionUser) {
  const db = getDb();
  if (isAdmin(user.email)) {
    const [all, owners] = await Promise.all([
      db.select({ id: t.spaces.id }).from(t.spaces),
      db.select({ spaceId: t.spaceMembers.spaceId }).from(t.spaceMembers).where(eq(t.spaceMembers.ruolo, 'proprietario'))
    ]);
    const orphans = all.filter(sp => !owners.some(o => o.spaceId === sp.id));
    if (orphans.length) await db.insert(t.spaceMembers).values(orphans.map(sp => ({ spaceId: sp.id, email: user.email, ruolo: 'proprietario' })))
      .onConflictDoUpdate({ target: [t.spaceMembers.spaceId, t.spaceMembers.email], set: { ruolo: 'proprietario' } });
  }
  const mine = await db.select().from(t.spaceMembers).where(eq(t.spaceMembers.email, user.email)).limit(1);
  if (mine.length) return;
  const sid = 's' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const first = user.name.trim().split(/\s+/)[0] || user.email.split('@')[0];
  await db.transaction(async tx => {
    await tx.insert(t.spaces).values({ id: sid, nome: `Studio di ${first}` });
    await tx.insert(t.spaceMembers).values({ spaceId: sid, email: user.email, ruolo: 'proprietario' });
  });
}

/* Gli spazi di cui l'utente fa parte, ognuno con le sue persone */
export async function spacesFor(user: SessionUser): Promise<UiSpace[]> {
  const db = getDb();
  const mine = await db.select().from(t.spaceMembers).where(eq(t.spaceMembers.email, user.email));
  if (!mine.length) return [];
  const ids = mine.map(m => m.spaceId);
  const [sps, members] = await Promise.all([
    db.select().from(t.spaces).where(inArray(t.spaces.id, ids)).orderBy(asc(t.spaces.createdAt)),
    db.select().from(t.spaceMembers).where(inArray(t.spaceMembers.spaceId, ids)).orderBy(asc(t.spaceMembers.createdAt))
  ]);
  const emails = [...new Set(members.map(m => m.email))];
  const us = await db.select().from(t.users).where(inArray(t.users.email, emails));
  const person = (email: string): Person => {
    const u = us.find(x => x.email === email);
    return { email, name: u?.nome || email.split('@')[0], picture: u?.foto || '' };
  };
  const roleOf = (r: string): Role => (r === 'proprietario' ? 'proprietario' : 'membro');
  return sps.map(sp => {
    const ms = members.filter(m => m.spaceId === sp.id);
    return {
      id: sp.id, name: sp.nome, role: roleOf(mine.find(m => m.spaceId === sp.id)!.ruolo),
      members: ms.map(m => ({ email: m.email, role: roleOf(m.ruolo) })),
      people: ms.map(m => person(m.email))
    };
  });
}

export async function loadAll(user: SessionUser, onlyBoard?: string) {
  const db = getDb();
  const spaceIds = (await spacesFor(user)).map(sp => sp.id);
  if (!spaceIds.length) return [];
  const bs = await db.select().from(t.boards)
    .where(onlyBoard ? and(inArray(t.boards.spaceId, spaceIds), eq(t.boards.id, onlyBoard)) : inArray(t.boards.spaceId, spaceIds))
    .orderBy(asc(t.boards.posizione), asc(t.boards.createdAt));
  const ids = bs.map(b => b.id);
  if (!ids.length) return [];
  const cs = await db.select().from(t.cards).where(inArray(t.cards.boardId, ids)).orderBy(asc(t.cards.posizione));
  const cardIds = cs.length ? cs.map(c => c.id) : [''];
  const names = new Map((await db.select().from(t.users)).map(u => [u.email, u.nome]));
  const [cols, labs, cls, cms, items, lks, msgs] = await Promise.all([
    db.select().from(t.columns).where(inArray(t.columns.boardId, ids)).orderBy(asc(t.columns.posizione)),
    db.select().from(t.labels).where(inArray(t.labels.boardId, ids)).orderBy(asc(t.labels.posizione)),
    db.select().from(t.cardLabels).where(inArray(t.cardLabels.cardId, cardIds)),
    db.select().from(t.cardMembers).where(inArray(t.cardMembers.cardId, cardIds)),
    db.select().from(t.checklistItems).where(inArray(t.checklistItems.cardId, cardIds)).orderBy(asc(t.checklistItems.posizione)),
    db.select().from(t.links).where(inArray(t.links.cardId, cardIds)).orderBy(asc(t.links.posizione)),
    db.select().from(t.messages).where(inArray(t.messages.cardId, cardIds)).orderBy(asc(t.messages.createdAt))
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
    id: b.id, title: b.titolo, view: b.vista, color: b.colore, created: b.createdAt.toISOString().slice(0, 10),
    space: b.spaceId, version: b.versione, by: b.modificatoDa,
    labels: labsOf(b.id).map(l => ({ id: l.id, name: l.nome, color: l.colore })),
    columns: colsOf(b.id).map(c => ({ id: c.id, title: c.titolo, type: c.tipo })),
    cards: cardsOf(b.id).map(c => ({
      id: c.id, col: c.columnId, title: c.titolo, notes: c.descrizione, due: c.scadenza,
      modules: c.moduli, color: c.colore, createdAt: c.createdAt.getTime(),
      labels: clOf(c.id).map(x => x.labelId),
      members: [...new Set(cmOf(c.id).map(x => owner(x.membro)))],
      checklist: itemsOf(c.id).map(i => ({ id: i.id, text: i.testo, done: i.completato })),
      links: linksOf(c.id).map(l => ({ id: l.id, url: l.url, title: l.titolo })),
      messages: msgsOf(c.id).map(m => {
        const by = owner(m.autore);
        return { id: m.id, by, me: by === user.email, name: names.get(by) || by.split('@')[0], html: m.html, at: m.createdAt.getTime(), edited: m.modificato };
      })
    }))
  }));
}

/* Salvataggio di una bacheca: in una sola transazione si cancella il contenuto precedente
   (a cascata) e si scrive quello nuovo. Se qualcosa va storto non cambia niente.
   Se nel frattempo qualcun altro ha salvato la stessa bacheca (versione diversa) non si
   scrive nulla e si restituisce la bacheca aggiornata, che il browser unisce alle sue modifiche. */
export type SaveResult = { ok: true; version: number } | { ok: false; status: number; error?: string; board?: unknown };

export async function saveBoard(user: SessionUser, id: string, input: UiBoard, posizione: number, version: number): Promise<SaveResult> {
  const db = getDb();
  const now = new Date();
  const allowed = new Set((await spacesFor(user)).map(sp => sp.id));
  if (!isId(id)) return { ok: false, status: 400, error: 'Dati non validi.' };
  const unique = <T extends { id: string }>(list: T[]) => list.filter((x, i) => list.findIndex(y => y.id === x.id) === i);
  const cols = unique(arr<UiBoard['columns'][number]>(input.columns).filter(c => c && isId(c.id)));
  const colIds = new Set(cols.map(c => c.id));
  const labs = unique(arr<UiBoard['labels'][number]>(input.labels).filter(l => l && isId(l.id)));
  const labIds = new Set(labs.map(l => l.id));
  const cs = unique(arr<UiCard>(input.cards).filter(c => c && isId(c.id) && colIds.has(c.col)));

  const result = await db.transaction(async (tx): Promise<SaveResult> => {
    const [prev] = await tx.select().from(t.boards).where(eq(t.boards.id, id)).for('update');
    const spaceId = prev ? prev.spaceId : str(input.space, 100);
    if (!allowed.has(spaceId)) return { ok: false, status: 403, error: 'Non hai accesso a questo spazio.' };
    if (prev && prev.versione !== version) return { ok: false, status: 409 };
    const next = (prev?.versione ?? 0) + 1;

    /* i messaggi restano di chi li ha scritti: gli altri non possono cambiarli */
    const oldMsgs = prev
      ? await tx.select({ id: t.messages.id, autore: t.messages.autore, html: t.messages.html, modificato: t.messages.modificato })
          .from(t.messages).innerJoin(t.cards, eq(t.messages.cardId, t.cards.id)).where(eq(t.cards.boardId, id))
      : [];
    const oldById = new Map(oldMsgs.map(m => [m.id, { ...m, autore: owner(m.autore) }]));

    /* la riga della bacheca si aggiorna (non si cancella), così resta bloccata fino alla fine:
       un secondo salvataggio contemporaneo aspetta e poi trova la versione nuova */
    const row = {
      spaceId, versione: next, modificatoDa: user.name,
      titolo: str(input.title, 500) || 'Senza titolo', posizione, vista: input.view === 'full' ? 'full' : 'essential',
      colore: Number.isInteger(input.color) && input.color! >= 0 && input.color! < 8 ? input.color! : null,
      createdAt: isDay(input.created) ? new Date(input.created + 'T12:00:00Z') : now
    };
    if (prev) {
      await tx.update(t.boards).set(row).where(eq(t.boards.id, id));
      await tx.delete(t.cards).where(eq(t.cards.boardId, id));
      await tx.delete(t.columns).where(eq(t.columns.boardId, id));
      await tx.delete(t.labels).where(eq(t.labels.boardId, id));
    } else {
      await tx.insert(t.boards).values({ id, ...row });
    }
    if (cols.length) await tx.insert(t.columns).values(cols.map((c, i) => ({ id: c.id, boardId: id, titolo: str(c.title, 500) || 'Senza titolo', tipo: ['in_corso', 'in_revisione', 'fatto'].includes(c.type) ? c.type : 'variabile', posizione: i })));
    if (labs.length) await tx.insert(t.labels).values(labs.map((l, i) => ({ id: l.id, boardId: id, nome: str(l.name, 200), colore: safeColor(l.color), posizione: i })));
    if (!cs.length) return { ok: true, version: next };
    await tx.insert(t.cards).values(cs.map((c, i) => ({
      id: c.id, columnId: c.col, boardId: id, titolo: str(c.title, 2000) || 'Senza titolo', descrizione: sanitizeHtml(str(c.notes)),
      scadenza: isDay(c.due) ? c.due : null, moduli: arr<string>(c.modules).filter(m => typeof m === 'string' && /^[a-z]{1,20}$/.test(m)),
      colore: Number.isInteger(c.color) && c.color! >= 0 && c.color! < 8 ? c.color! : null,
      posizione: i, createdAt: typeof c.createdAt === 'number' ? new Date(c.createdAt) : now, updatedAt: now
    })));
    const cl = cs.flatMap(c => [...new Set(arr<string>(c.labels))].filter(l => labIds.has(l)).map(labelId => ({ cardId: c.id, labelId })));
    if (cl.length) await tx.insert(t.cardLabels).values(cl);
    const cm = cs.flatMap(c => [...new Set(arr<string>(c.members).filter(isEmail))].map(membro => ({ cardId: c.id, membro })));
    if (cm.length) await tx.insert(t.cardMembers).values(cm);
    const items = unique(cs.flatMap(c => arr<UiCard['checklist'][number]>(c.checklist).filter(i => i && isId(i.id)).map((i, n) => ({ id: i.id, cardId: c.id, testo: str(i.text, 5000), completato: !!i.done, posizione: n }))));
    if (items.length) await tx.insert(t.checklistItems).values(items);
    const lks = unique(cs.flatMap(c => arr<UiCard['links'][number]>(c.links).filter(l => l && isId(l.id)).map((l, n) => ({ id: l.id, cardId: c.id, url: safeUrl(l.url), titolo: str(l.title, 500), posizione: n }))));
    if (lks.length) await tx.insert(t.links).values(lks);
    const seen = new Set<string>();
    const msgs = cs.flatMap(c => arr<UiCard['messages'][number]>(c.messages).filter(m => m && isId(m.id) && !seen.has(m.id) && seen.add(m.id)).map(m => {
      const old = oldById.get(m.id);
      const mine = !old || old.autore === user.email;
      return {
        id: m.id, cardId: c.id, autore: old ? old.autore : user.email,
        html: mine ? sanitizeHtml(str(m.html)) : old!.html, modificato: mine ? !!m.edited : old!.modificato,
        createdAt: typeof m.at === 'number' ? new Date(m.at) : now
      };
    }));
    if (msgs.length) await tx.insert(t.messages).values(msgs);
    return { ok: true, version: next };
  });
  if (!result.ok && result.status === 409) return { ...result, board: (await loadAll(user, id))[0] };
  return result;
}

export async function deleteBoard(user: SessionUser, id: string) {
  const db = getDb();
  const [b] = await db.select({ spaceId: t.boards.spaceId }).from(t.boards).where(eq(t.boards.id, id));
  if (!b) return true;
  if (!(await spacesFor(user)).some(sp => sp.id === b.spaceId)) return false;
  await db.delete(t.boards).where(eq(t.boards.id, id));
  return true;
}

/* Gestione degli spazi: chiunque può crearne uno (ne diventa proprietario);
   nome, inviti e ruoli li cambia solo un proprietario */
const cleanEmail = (v: unknown) => { const e = str(v, 200).trim().toLowerCase(); return isEmail(e) ? e : ''; };

export async function createSpace(user: SessionUser, id: string, name: string) {
  if (!isId(id)) throw new Error('id non valido');
  await getDb().transaction(async tx => {
    await tx.insert(t.spaces).values({ id, nome: str(name, 200).trim() || 'Nuovo spazio' });
    await tx.insert(t.spaceMembers).values({ spaceId: id, email: user.email, ruolo: 'proprietario' });
  });
}

export async function roleIn(user: SessionUser, spaceId: string) {
  const [m] = await getDb().select().from(t.spaceMembers).where(and(eq(t.spaceMembers.spaceId, spaceId), eq(t.spaceMembers.email, user.email)));
  return m ? m.ruolo : null;
}

/* Una sola operazione per richiesta: rinominare, invitare, rimuovere (o uscire), nominare o togliere un proprietario.
   Uno spazio non resta mai senza proprietario. */
export async function updateSpace(user: SessionUser, id: string, input: { name?: unknown; invite?: unknown; remove?: unknown; promote?: unknown; demote?: unknown }) {
  const db = getDb();
  const role = await roleIn(user, id);
  const leaving = cleanEmail(input.remove) === user.email;
  if (role !== 'proprietario' && !(role && leaving)) return 'Solo il proprietario può gestire questo spazio.';
  if (typeof input.name === 'string') {
    await db.update(t.spaces).set({ nome: str(input.name, 200).trim() || 'Senza nome' }).where(eq(t.spaces.id, id));
  } else if (input.invite !== undefined) {
    const email = cleanEmail(input.invite);
    if (!email) return 'Email non valida.';
    await db.insert(t.spaceMembers).values({ spaceId: id, email }).onConflictDoNothing();
  } else if (input.remove !== undefined || input.promote !== undefined || input.demote !== undefined) {
    const email = cleanEmail(input.remove ?? input.promote ?? input.demote);
    const ms = await db.select().from(t.spaceMembers).where(eq(t.spaceMembers.spaceId, id));
    const target = ms.find(m => m.email === email);
    if (!target) return 'Questa persona non è nello spazio.';
    const where = and(eq(t.spaceMembers.spaceId, id), eq(t.spaceMembers.email, email));
    if (input.promote !== undefined) { await db.update(t.spaceMembers).set({ ruolo: 'proprietario' }).where(where); return null; }
    if (target.ruolo === 'proprietario' && ms.filter(m => m.ruolo === 'proprietario').length === 1) return 'Prima nomina un altro proprietario.';
    if (input.demote !== undefined) { await db.update(t.spaceMembers).set({ ruolo: 'membro' }).where(where); return null; }
    await db.delete(t.spaceMembers).where(and(eq(t.spaceMembers.spaceId, id), eq(t.spaceMembers.email, email)));
  }
  return null;
}

/* Si elimina solo uno spazio vuoto, così nessuna bacheca sparisce per sbaglio */
export async function deleteSpace(user: SessionUser, id: string) {
  const db = getDb();
  if ((await roleIn(user, id)) !== 'proprietario') return 'Solo il proprietario può eliminare questo spazio.';
  const used = await db.select({ id: t.boards.id }).from(t.boards).where(eq(t.boards.spaceId, id)).limit(1);
  if (used.length) return 'Lo spazio contiene ancora delle bacheche.';
  await db.delete(t.spaces).where(eq(t.spaces.id, id));
  return null;
}

/* Inviti a Flow: solo l'amministratore li gestisce */
export async function listInvites() {
  return (await getDb().select().from(t.inviti).orderBy(asc(t.inviti.createdAt))).map(i => i.email);
}
export async function addInvite(v: unknown) {
  const email = cleanEmail(v);
  if (!email) return false;
  await getDb().insert(t.inviti).values({ email }).onConflictDoNothing();
  return true;
}
export async function removeInvite(v: unknown) {
  await getDb().delete(t.inviti).where(eq(t.inviti.email, cleanEmail(v)));
}
