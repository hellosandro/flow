import { APP_HTML } from '@/lib/ui-html';

export const dynamic = 'force-static';

export function GET() {
  return new Response(APP_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
