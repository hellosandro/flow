import { NextResponse } from 'next/server';
import { userOf } from '@/lib/auth';
import { deleteSpace, updateSpace } from '@/lib/store';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await userOf(req);
  if (!user) return NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
  try {
    const error = await updateSpace(user, id, body);
    return error ? NextResponse.json({ error }, { status: 403 }) : NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a salvare lo spazio.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await userOf(req);
  if (!user) return NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 });
  const { id } = await params;
  try {
    const error = await deleteSpace(user, id);
    return error ? NextResponse.json({ error }, { status: 409 }) : NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a eliminare lo spazio.' }, { status: 500 });
  }
}
