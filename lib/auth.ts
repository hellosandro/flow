/* Accesso con Google. Dopo il login il cookie di sessione contiene email, nome e foto
   dell'utente, firmati con AUTH_SECRET (impostata su Vercel): nessuno può falsificarlo.
   Funziona sia nel middleware sia nelle API. */
export const SESSION_COOKIE = 'flow_session';
export const STATE_COOKIE = 'flow_oauth';
export const SESSION_DAYS = 30;

export type SessionUser = { email: string; name: string; picture: string };

const enc = new TextEncoder();

function secret() {
  return process.env.AUTH_SECRET || '';
}

async function hmac(msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

function b64url(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

/* Confronto a tempo costante, così la durata della risposta non rivela niente */
function sameString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function makeSession(user: SessionUser) {
  const body = b64url(enc.encode(JSON.stringify({ e: user.email, n: user.name, p: user.picture, x: Date.now() + SESSION_DAYS * 864e5 })));
  return body + '.' + (await hmac(body));
}

export async function readSession(cookie: string | undefined): Promise<SessionUser | null> {
  if (!secret() || !cookie) return null;
  const [body, sig] = cookie.split('.');
  if (!body || !sig || !sameString(sig, await hmac(body))) return null;
  try {
    const d = JSON.parse(fromB64url(body));
    if (typeof d.e !== 'string' || !(d.x > Date.now())) return null;
    return { email: d.e, name: String(d.n || ''), picture: String(d.p || '') };
  } catch {
    return null;
  }
}

/* Chi può creare spazi e invitare persone: le email in FLOW_ADMIN, separate da virgole */
export function admins() {
  return (process.env.FLOW_ADMIN || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

export const isAdmin = (email: string) => admins().includes(email.toLowerCase());

/* Utente della richiesta, per le API (il middleware ha già respinto chi non ha la sessione) */
export async function userOf(req: Request) {
  const raw = (req.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(SESSION_COOKIE + '='));
  return readSession(raw ? decodeURIComponent(raw.slice(SESSION_COOKIE.length + 1)) : undefined);
}

export const googleConfigured = () => !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && secret());
