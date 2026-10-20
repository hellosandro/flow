import { NextResponse } from 'next/server';
import { isAdmin, userOf } from '@/lib/auth';
import { deleteSpace, updateSpace } from '@/lib/store';

type Ctx = { params: Promise<{ id: string }> };

async function adminOnly(req: Request) {
  const user = await userOf(req);
  return user && isAdmin(user.email) ? null : NextResponse.json({ error: 'Solo gli amministratori gestiscono gli spazi.' }, { status: 403 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Dati non validi.' }, { status: 400 });
  try {
    await updateSpace(id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a salvare lo spazio.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const { id } = await params;
  try {
    if (!(await deleteSpace(id))) return NextResponse.json({ error: 'Lo spazio contiene ancora delle bacheche.' }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a eliminare lo spazio.' }, { status: 500 });
  }
}
