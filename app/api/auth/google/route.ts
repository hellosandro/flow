import { NextResponse } from 'next/server';
import { STATE_COOKIE, googleConfigured } from '@/lib/auth';

/* Primo passo del login: si va da Google, che poi rimanda a /api/auth/callback/google */
export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!googleConfigured()) return NextResponse.redirect(new URL('/login?e=config', origin));
  const state = crypto.randomUUID();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: process.env.AUTH_GOOGLE_ID!, redirect_uri: origin + '/api/auth/callback/google',
    response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account'
  }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: origin.startsWith('https'), sameSite: 'lax', path: '/', maxAge: 600 });
  return res;
}
