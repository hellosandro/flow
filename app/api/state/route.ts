import { NextResponse } from 'next/server';
import { loadAll } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ boards: await loadAll() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Non riesco a leggere il database.' }, { status: 500 });
  }
}
