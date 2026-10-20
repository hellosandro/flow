import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, readSession } from './lib/auth';

/* Senza login, tutte le pagine portano alla schermata di accesso e le API rispondono 401 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) return NextResponse.next();
  if (await readSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 });
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico).*)']
};
