import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_DAYS, STATE_COOKIE, makeSession } from '@/lib/auth';
import { canEnter, rememberUser } from '@/lib/store';

/* Google rimanda qui con un codice: lo si scambia con i dati dell'utente (email, nome, foto).
   Entra solo chi è amministratore o è stato invitato in almeno uno spazio. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (e: string) => {
    const res = NextResponse.redirect(new URL('/login?e=' + e, url.origin));
    res.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  };
  const state = (req.headers.get('cookie') || '').match(new RegExp(STATE_COOKIE + '=([^;]+)'))?.[1];
  const code = url.searchParams.get('code');
  if (!code || !state || state !== url.searchParams.get('state')) return back('retry');

  let profile: { email?: string; email_verified?: boolean; name?: string; picture?: string };
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: process.env.AUTH_GOOGLE_ID!, client_secret: process.env.AUTH_GOOGLE_SECRET!,
        redirect_uri: url.origin + '/api/auth/callback/google', grant_type: 'authorization_code'
      })
    });
    const tok = await r.json();
    if (!r.ok || typeof tok.id_token !== 'string') throw new Error(tok.error || r.status);
    /* l'id_token arriva direttamente da Google su connessione cifrata: basta leggerlo */
    profile = JSON.parse(Buffer.from(tok.id_token.split('.')[1], 'base64url').toString());
  } catch (err) {
    console.error(err);
    return back('retry');
  }
  const email = (profile.email || '').toLowerCase();
  if (!email || profile.email_verified === false) return back('retry');
  if (!(await canEnter(email))) return back('noaccess');

  const user = { email, name: profile.name || email.split('@')[0], picture: profile.picture || '' };
  await rememberUser(user);
  const res = NextResponse.redirect(new URL('/', url.origin));
  res.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set(SESSION_COOKIE, await makeSession(user), {
    httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 24 * 3600
  });
  return res;
}
