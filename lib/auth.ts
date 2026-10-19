/* Accesso con una sola password (FLOW_PASSWORD, impostata su Vercel).
   Il cookie di sessione contiene una firma derivata dalla password: se la password cambia,
   tutti i dispositivi devono rientrare. Funziona sia nel middleware sia nelle API. */
export const SESSION_COOKIE = 'flow_session';
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
}

export function password() {
  return process.env.FLOW_PASSWORD || '';
}

export async function sessionToken() {
  const pw = password();
  return pw ? hmac(pw, 'flow-session-v1') : '';
}

/* Confronto a tempo costante, così la durata della risposta non rivela niente */
function sameString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(cookie: string | undefined) {
  const token = await sessionToken();
  return !!token && !!cookie && sameString(cookie, token);
}

export async function isRightPassword(attempt: string) {
  const pw = password();
  if (!pw) return false;
  /* si confrontano le firme, non le password, così le lunghezze coincidono sempre */
  return sameString(await hmac('flow-login', attempt), await hmac('flow-login', pw));
}
