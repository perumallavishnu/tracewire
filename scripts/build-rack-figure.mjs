// Writes static preview pages of the hero figure for the anatomy line check.
// Usage: node scripts/build-rack-figure.mjs <out-dir>
// The figure itself is built at runtime by src/site/figure/rackScene.js.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRackScene } from '../src/site/figure/rackScene.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(ROOT, '.figure-preview');
mkdirSync(out, { recursive: true });
const css = readFileSync(join(ROOT, 'src/site/iso/iso.css'), 'utf8') + readFileSync(join(ROOT, 'src/site/figure/rack.css'), 'utf8');
for (const [racks, tier] of [[1, 1], [2, 2], [3, 3], [4, 4]]) {
  const { svg } = buildRackScene({ racks, tier });
  const file = join(out, `rack-${racks}x${tier}.html`);
  writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#0b0e11}${css}</style><div class="iso fig-rack" style="max-width:900px;margin:auto">${svg}</div>`);
  console.log('wrote', file);
}
