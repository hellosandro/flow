import { NextResponse } from 'next/server';
import { deleteBoard, saveBoard } from '@/lib/store';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.board || body.board.id !== id) return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
  try {
    await saveBoard(id, body.board, Number.isFinite(body.posizione) ? body.posizione : 0);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Salvataggio non riuscito.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await deleteBoard(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Eliminazione non riuscita.' }, { status: 500 });
  }
}
