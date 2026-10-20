/* Pulizia dell'HTML di descrizioni e messaggi prima di salvarlo. Restano solo i tag della
   formattazione (grassetto, elenchi, titoli, link…) senza attributi, tranne l'indirizzo dei link:
   così nessuno può inserire codice che verrebbe eseguito nel browser degli altri. */
const ALLOWED = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'blockquote', 'div', 'span']);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|template|textarea|title|noscript|svg|math)\b[\s\S]*?(<\/\1\s*>|$)/gi;
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;

const escText = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');

function safeHref(attrs: string) {
  const m = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const raw = (m?.[2] ?? m?.[3] ?? m?.[4] ?? '').replace(/&amp;/g, '&').trim();
  if (!/^(https?:\/\/|mailto:)/i.test(raw)) return '';
  return raw.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sanitizeHtml(input: string) {
  const html = input.replace(/<!--[\s\S]*?(-->|$)/g, '').replace(DROP_WITH_CONTENT, '');
  let out = '', last = 0;
  for (const m of html.matchAll(TAG)) {
    out += escText(html.slice(last, m.index));
    last = m.index! + m[0].length;
    const [, close, name] = m, tag = name.toLowerCase();
    if (!ALLOWED.has(tag)) continue;
    if (close) { if (tag !== 'br') out += `</${tag}>`; continue; }
    if (tag === 'a') { const href = safeHref(m[3]); out += href ? `<a href="${href}" target="_blank" rel="noopener">` : '<a>'; continue; }
    out += `<${tag}>`;
  }
  return out + escText(html.slice(last));
}
