import { NextResponse } from 'next/server';
import { userOf } from '@/lib/auth';
import { createSpace } from '@/lib/store';

/* Chiunque sia dentro può creare uno spazio, e ne diventa proprietario */
export async function POST(req: Request) {
  const user = await userOf(req);
  if (!user) return NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== 'string' || !body.id) return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
  try {
    await createSpace(user, body.id, String(body.name || ''));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a creare lo spazio.' }, { status: 500 });
  }
}
