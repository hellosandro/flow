/* Avvolge le pagine di ui/ in un documento completo e le scrive in lib/ui-html.ts,
   che le route "/" e "/login" restituiscono così come sono. */
import { readFileSync, writeFileSync } from 'node:fs';

const shell = body => `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="FLOW">
<meta name="robots" content="noindex">
<style>
:root { color-scheme: light; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box; height: 100%; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { margin: 0; font: 14px/1.4 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
</head>
<body>
${body}
</body>
</html>
`;

const app = shell(readFileSync('ui/flow.html', 'utf8'));
const login = shell(readFileSync('ui/login.html', 'utf8'));
writeFileSync('lib/ui-html.ts', `// File generato da scripts/build-ui.mjs: non modificarlo a mano.\nexport const APP_HTML = ${JSON.stringify(app)};\nexport const LOGIN_HTML = ${JSON.stringify(login)};\n`);
console.log('Interfaccia pronta: lib/ui-html.ts');
