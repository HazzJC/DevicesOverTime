import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'src', 'assets']) await cp(resolve(root, name), resolve(dist, name), { recursive: true });
const { devices } = await import('../src/data.js');
if (devices.length !== 27 || new Set(devices.map(d => d.id)).size !== 27) throw new Error('Expected 26 devices and one unique upgrade milestone.');
for (const file of ['backdrop.png', 'phones.png', 'laptops.png', 'desktops.png']) {
  const bytes = await readFile(resolve(dist, 'assets', file));
  if (bytes.length < 1000) throw new Error(`Missing or invalid illustration: ${file}`);
}
await writeFile(resolve(dist, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'\n/assets/*\n  Cache-Control: public, max-age=86400\n`);
await writeFile(resolve(dist, 'robots.txt'), 'User-agent: *\nAllow: /\n');
console.log(`Built static site: ${devices.length} milestones, all illustration assets present. Output: dist/`);
