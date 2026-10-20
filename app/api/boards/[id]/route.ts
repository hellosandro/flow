import { NextResponse } from 'next/server';
import { userOf } from '@/lib/auth';
import { deleteBoard, saveBoard } from '@/lib/store';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await userOf(req);
  if (!user) return NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.board || body.board.id !== id) return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
  try {
    const r = await saveBoard(user, id, body.board, Number.isFinite(body.posizione) ? body.posizione : 0, Number.isInteger(body.version) ? body.version : 0);
    if (r.ok) return NextResponse.json({ ok: true, version: r.version });
    return NextResponse.json({ error: r.error || 'La bacheca è stata modificata da qualcun altro.', board: r.board }, { status: r.status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Salvataggio non riuscito.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await userOf(req);
  if (!user) return NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 });
  try {
    if (!(await deleteBoard(user, id))) return NextResponse.json({ error: 'Non hai accesso a questa bacheca.' }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Eliminazione non riuscita.' }, { status: 500 });
  }
}
