import { NextResponse } from 'next/server';
import { isAdmin, userOf } from '@/lib/auth';
import { ensureHome, loadAll, spacesFor } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await userOf(req);
  if (!user) return NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 });
  try {
    await ensureHome(user);
    const [spaces, boards] = await Promise.all([spacesFor(user), loadAll(user)]);
    return NextResponse.json({ me: { ...user, admin: isAdmin(user.email) }, spaces, boards }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a leggere il database.' }, { status: 500 });
  }
}
