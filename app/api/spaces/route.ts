import { NextResponse } from 'next/server';
import { isAdmin, userOf } from '@/lib/auth';
import { createSpace } from '@/lib/store';

export async function POST(req: Request) {
  const user = await userOf(req);
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'Solo gli amministratori creano spazi.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== 'string' || !body.id) return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
  try {
    await createSpace(body.id, String(body.name || ''));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a creare lo spazio.' }, { status: 500 });
  }
}
