import { NextResponse } from 'next/server';
import { isAdmin, userOf } from '@/lib/auth';
import { addInvite, listInvites, removeInvite } from '@/lib/store';

/* Inviti a Flow (chi può entrare e aprire il suo studio): solo per l'amministratore */
async function admin(req: Request) {
  const user = await userOf(req);
  return !!user && isAdmin(user.email);
}
const denied = () => NextResponse.json({ error: 'Solo l’amministratore gestisce gli inviti.' }, { status: 403 });

export async function GET(req: Request) {
  if (!(await admin(req))) return denied();
  return NextResponse.json({ invites: await listInvites() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (!(await admin(req))) return denied();
  const body = await req.json().catch(() => null);
  if (!(await addInvite(body?.email))) return NextResponse.json({ error: 'Email non valida.' }, { status: 400 });
  return NextResponse.json({ invites: await listInvites() });
}

export async function DELETE(req: Request) {
  if (!(await admin(req))) return denied();
  const body = await req.json().catch(() => null);
  await removeInvite(body?.email);
  return NextResponse.json({ invites: await listInvites() });
}
