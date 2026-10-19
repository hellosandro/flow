import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_DAYS, isRightPassword, password, sessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  if (!password()) return NextResponse.json({ error: 'FLOW_PASSWORD non è impostata su Vercel.' }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const attempt = typeof body?.password === 'string' ? body.password : '';
  if (!(await isRightPassword(attempt))) {
    /* una piccola attesa rende inutili i tentativi a raffica */
    await new Promise(r => setTimeout(r, 700));
    return NextResponse.json({ error: 'Password errata.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 24 * 3600
  });
  return res;
}
