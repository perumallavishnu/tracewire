// Builds the landing page's isometric figure: a server rack on a load bench.
// Run: node scripts/build-rack-figure.mjs   (writes src/site/figure/rack.generated.js)
//      node scripts/build-rack-figure.mjs --preview <file.html>  (also writes a static preview page)
//
// Object: a traffic generator on a bench feeds a rack (load balancer, five app blades,
// a cache, two database units). The knob sets the request rate, every unit's front meter
// shows its utilization, and the dial gauge reads p99. All of it is driven at runtime by
// src/simulation/analyze.js, the same model that scores designs in the simulator.
// Drawn with the anatomy kit (MIT, github.com/wheresryan22/anatomy), copied to src/site/iso.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from '../src/site/iso/iso-kit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIDTH = 640;
const HEIGHT = 560;

// ---------- world plan (units ≈ px of the real thing; x/y on the bench, z up) ----------
const BENCH = { x: -120, y: -70, w: 240, d: 140, r: 6 };
const BENCH_H = 10;
const FOOT_H = 6;

const RACK = { x: -44, y: -26, w: 74, d: 52 };
const FRONT_Y = RACK.y + RACK.d; // visible front face of the rack (y+)
const SIDE_X = RACK.x + RACK.w; // visible side (x+), where the patch cables run
const POST = 4;
const PLINTH_H = 6;
const UNIT = { x: RACK.x + POST, y: RACK.y + 2, w: RACK.w - POST * 2, d: RACK.d - 2 };
const GAP = 1.6;

// bottom to top
const UNITS = [
  { id: 'db-1', label: 'DB PRIMARY', h: 15, kind: 'db' },
  { id: 'db-2', label: 'DB REPLICA', h: 15, kind: 'db' },
  { id: 'cache', label: 'CACHE', h: 11, kind: 'cache' },
  { id: 'svc-1', label: 'APP 1', h: 7, kind: 'svc' },
  { id: 'svc-2', label: 'APP 2', h: 7, kind: 'svc' },
  { id: 'svc-3', label: 'APP 3', h: 7, kind: 'svc' },
  { id: 'svc-4', label: 'APP 4', h: 7, kind: 'svc' },
  { id: 'svc-5', label: 'APP 5', h: 7, kind: 'svc' },
  { id: 'lb', label: 'LOAD BALANCER', h: 9, kind: 'lb' },
];
let z = PLINTH_H + GAP;
for (const u of UNITS) {
  u.z = z;
  z += u.h + GAP;
}
const RACK_TOP = z + 1;

const GEN = { x: 48, y: 8, w: 50, d: 36, r: 3 };
const GEN_H = 15;
const KNOB = [GEN.x + 36, GEN.y + 18];
const KNOB_R = 7;

const GAUGE = [78, -38];
const GAUGE_Z = 46;
const GAUGE_R = 17;
const GAUGE_H = 8;
const GAUGE_TOP = GAUGE_Z + GAUGE_H;

const P = k.fitProjection(
  [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), ...k.boxCorners(RACK, 0, RACK_TOP + 2), [GAUGE[0], GAUGE[1], GAUGE_TOP + 2]],
  WIDTH,
  HEIGHT,
  { pad: 10, azimuth: 42 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const tenth = (v) => Math.round(v * 10) / 10;

// Draws children in a face's own 2D coordinates: u along the face, v downward from z.
const onFront = (x0, zTop, children) => `<g transform="${k.sideMatrix([x0, FRONT_Y], zTop, P, 'left')}">${children}</g>`;
const onSide = (y0, zTop, children) => `<g transform="${k.sideMatrix([SIDE_X, y0], zTop, P, 'right')}">${children}</g>`;

// ---------- bench ----------
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`];
  const feet = k.corners(BENCH, 20).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7, -BENCH_H - FOOT_H, 1.6, P, 28), { tone: 'lo' }));
    out.push(S(k.cylinder(x, y, 5.2, -BENCH_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: 'mid' }));
  }
  out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }));
  const screws = k.corners(BENCH, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge, ticks every 5, a major every 25
  const strip = { x: BENCH.x + 14, y: BENCH.y + BENCH.d - 13, w: 150, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
  // ticks hang from the strip's back edge; majors cross the whole strip so both ends land on its outline
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y, 0.6, [2, strip.d + 0.3], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate on the bench front
  const plateX = BENCH.x + 150;
  out.push(
    `<g transform="${k.sideMatrix([plateX, BENCH.y + BENCH.d], -1.8, P, 'left')}">` +
      `<rect class="fig-plate" x="0" y="0" width="58" height="6.4"/>` +
      `<text class="fig-engrave" x="3" y="4.4" font-size="3">LOAD BENCH · TW-1</text>` +
      `<circle class="fig-screw" cx="1.4" cy="3.2" r="0.6"/><circle class="fig-screw" cx="56.6" cy="3.2" r="0.6"/>` +
      `</g>`,
  );
  return out.join('');
}

// ---------- rack ----------
const postPlans = {
  backLeft: { x: RACK.x, y: RACK.y, w: POST, d: POST, r: 0.6 },
  backRight: { x: RACK.x + RACK.w - POST, y: RACK.y, w: POST, d: POST, r: 0.6 },
  frontLeft: { x: RACK.x, y: FRONT_Y - POST, w: POST, d: POST, r: 0.6 },
  frontRight: { x: RACK.x + RACK.w - POST, y: FRONT_Y - POST, w: POST, d: POST, r: 0.6 },
};

function post(plan) {
  const out = [S(k.slabOf(plan, PLINTH_H, RACK_TOP - PLINTH_H, P, 3, 0.3), { tone: 'mid' })];
  return out.join('');
}

function rackBack() {
  const out = [`<path class="iso-halo" d="${k.haloOf({ ...RACK, r: 1.2 }, 0, 0.1, P)}" style="filter:blur(6px)"/>`];
  out.push(S(k.slabOf({ ...RACK, r: 1.2 }, 0, PLINTH_H, P, 4, 0.6), { tone: 'lo' }));
  // plinth vent slots on the front
  out.push(onFront(RACK.x, PLINTH_H, Array.from({ length: 12 }, (_, i) => `<rect class="fig-slot" x="${8 + i * 5}" y="2" width="2.6" height="2" rx="0.6"/>`).join('')));
  out.push(post(postPlans.backLeft), post(postPlans.backRight));
  return out.join('');
}

function meterFor(unit, width) {
  // track + fill + LED, in front-face coordinates; fill width is set live
  const y = unit.h / 2 - 1.3;
  const x = UNIT.w - width - 9;
  return (
    `<rect class="fig-track" x="${x}" y="${tenth(y)}" width="${width}" height="2.6" rx="0.6"/>` +
    `<rect class="fig-meter" data-meter="${unit.id}" x="${x}" y="${tenth(y)}" width="0" height="2.6" rx="0.6"/>` +
    `<circle class="fig-led" data-led="${unit.id}" cx="${UNIT.w - 5}" cy="${tenth(unit.h / 2)}" r="1.15"/>`
  );
}

function unitSvg(unit) {
  const plan = { ...UNIT, r: 0.8 };
  const out = [S(k.slabOf(plan, unit.z, unit.h, P, 3, 0.5), { tone: unit.kind === 'svc' ? 'hi' : 'mid', crease: 'lo' })];
  const face = [];
  // screws in the ears
  face.push(`<circle class="fig-screw" cx="1.8" cy="${tenth(unit.h / 2)}" r="0.55"/>`, `<circle class="fig-screw" cx="${UNIT.w - 1.8}" cy="${tenth(unit.h / 2)}" r="0.55"/>`);
  face.push(`<text class="fig-engrave" x="4.5" y="${tenth(unit.h / 2 + 1.1)}" font-size="${unit.h > 8 ? 3 : 2.6}">${unit.label}</text>`);
  if (unit.kind === 'db') {
    // drive bays
    for (let i = 0; i < 4; i++) face.push(`<rect class="fig-bay" x="${24 + i * 7}" y="2.2" width="6" height="${unit.h - 4.4}" rx="0.5"/><circle class="fig-bay-led" cx="${27 + i * 7}" cy="${unit.h - 3.4}" r="0.5"/>`);
    face.push(meterFor(unit, 10));
  } else if (unit.kind === 'cache') {
    for (let i = 0; i < 8; i++) face.push(`<rect class="fig-slot" x="${22 + i * 3.4}" y="2.4" width="1.6" height="${unit.h - 4.8}" rx="0.5"/>`);
    face.push(meterFor(unit, 12));
  } else if (unit.kind === 'lb') {
    for (let i = 0; i < 6; i++) face.push(`<rect class="fig-port" x="${30 + i * 3.6}" y="2.4" width="2.6" height="2.4" rx="0.3"/>`);
    face.push(`<circle class="fig-led" data-led="lb" cx="${UNIT.w - 5}" cy="${tenth(unit.h / 2)}" r="1.15"/>`);
  } else {
    face.push(meterFor(unit, 18));
  }
  out.push(onFront(UNIT.x, unit.z + unit.h, face.join('')));
  return out.join('');
}

function rackFront() {
  const out = [post(postPlans.frontLeft), post(postPlans.frontRight)];
  // rail holes on the front posts
  for (const x of [RACK.x + 2, RACK.x + RACK.w - 2]) {
    const holes = [];
    for (let zz = PLINTH_H + 4; zz < RACK_TOP - 2; zz += 5) holes.push(at([x, FRONT_Y, zz]));
    out.push(D(holes, { size: 0.42, tone: 'lo' }));
  }
  // top cap with a vent grille
  const cap = { x: RACK.x - 1, y: RACK.y - 1, w: RACK.w + 2, d: RACK.d + 2, r: 1.5 };
  out.push(S(k.slabOf(cap, RACK_TOP, 3, P, 4, 0.6), { tone: 'mid' }));
  // vent slots run from one side of the inset frame to the other, so both ends land on it
  const frame = k.insetPlan(cap, 4);
  out.push(L(k.planOutline(frame, RACK_TOP + 3, P), { tone: 'lo' }));
  for (let i = 0; i < 9; i++) {
    const x = RACK.x + 10 + i * 6;
    out.push(L(k.lineOnTop([x, frame.y], [x, frame.y + frame.d], RACK_TOP + 3, P), { tone: 'faint' }));
  }
  out.push(D(k.corners(cap, 3).map(([x, y]) => at([x, y, RACK_TOP + 3])), { size: 0.45 }));
  return out.join('');
}

// ---------- cables on the visible side ----------
const unitById = Object.fromEntries(UNITS.map((u) => [u.id, u]));
const midZ = (id) => unitById[id].z + unitById[id].h / 2;
const port = (y, zz) => [SIDE_X + 0.8, y, zz];

function cables() {
  const out = [];
  // load balancer to each app blade: a vertical drop per blade
  ['svc-1', 'svc-2', 'svc-3', 'svc-4', 'svc-5'].forEach((id, i) => {
    const y = -18 + i * 4.2;
    out.push(k.wireSvg(at(port(y, midZ('lb'))), at(port(y, midZ(id))), { tone: 'mid' }));
  });
  // blades to the cache, cache to both databases
  out.push(k.wireSvg(at(port(6, midZ('svc-3'))), at(port(6, midZ('cache'))), { tone: 'mid' }));
  out.push(k.wireSvg(at(port(12, midZ('cache'))), at(port(12, midZ('db-2'))), { tone: 'mid' }));
  out.push(k.wireSvg(at(port(17, midZ('cache'))), at(port(17, midZ('db-1'))), { tone: 'mid' }));
  // the request cable from the generator into the load balancer
  const from = [GEN.x + 8, GEN.y + 10, GEN_H];
  const via = [at([GEN.x + 8, GEN.y + 10, GEN_H + 14]), at([SIDE_X + 10, 10, GEN_H + 14]), at([SIDE_X + 10, 10, midZ('lb')])];
  const to = at(port(10, midZ('lb')));
  const d = k.pathOf([at(from), ...via, to]);
  out.push(`<g class="iso-wire" data-tone="hi">${L(d, { tone: 'hi' })}<circle class="iso-wire-end" cx="${tenth(at(from)[0])}" cy="${tenth(at(from)[1])}" r="1.2"/><circle class="iso-wire-end" cx="${tenth(to[0])}" cy="${tenth(to[1])}" r="1.2"/></g>`);
  out.push(`<path data-part="feed" d="${d}" fill="none" stroke="none"/>`);
  out.push(`<g data-part="pulses"></g>`);
  return out.join('');
}

// ---------- traffic generator ----------
function generator() {
  const out = [`<path class="iso-halo" d="${k.haloOf(GEN, 0, 0.1, P)}" style="filter:blur(5px)"/>`];
  out.push(S(k.slabOf(GEN, 0, GEN_H, P, 5, 0.7), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(GEN, 3), GEN_H, P), { tone: 'faint' }));
  out.push(D([at([GEN.x + 4, GEN.y + 4, GEN_H]), at([GEN.x + GEN.w - 4, GEN.y + 4, GEN_H]), at([GEN.x + 4, GEN.y + GEN.d - 4, GEN_H])], { size: 0.45 }));
  out.push(k.faceTextSvg(k.topMatrix([GEN.x + 6, GEN.y + 30], GEN_H, P, 'x'), 'TRAFFIC', { size: 3, tone: 'mid' }));
  // knob with a knurled rim and a pointer line (rotated live)
  out.push(S(k.cylinder(KNOB[0], KNOB[1], KNOB_R + 2, GEN_H, 1.2, P, 40), { tone: 'lo' }));
  out.push(L(k.ring(KNOB[0], KNOB[1], KNOB_R + 1.6, GEN_H + 1.2, P, 40), { tone: 'lo' }));
  const ticks = k.radialTicks(KNOB[0], KNOB[1], KNOB_R + 1.6, 20, 5, GEN_H + 1.2, [0.8, 1.6], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(S(k.cylinder(KNOB[0], KNOB[1], KNOB_R, GEN_H + 1.2, 5, P, 40, 0.5), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.knurl(KNOB[0], KNOB[1], KNOB_R, GEN_H + 1.6, GEN_H + 5.6, 44, P, 0.3), { tone: 'lo' }));
  out.push(L(k.sideArc(KNOB[0], KNOB[1], KNOB_R, GEN_H + 1.6, P, 32), { tone: 'faint' }));
  out.push(`<path data-part="knob" class="iso-line" data-tone="lit" data-free="start" d="" style="stroke-width:1.2"/>`);
  // front face: LED row and a vent
  out.push(
    `<g transform="${k.sideMatrix([GEN.x, GEN.y + GEN.d], GEN_H, P, 'left')}">` +
      Array.from({ length: 5 }, (_, i) => `<circle class="fig-led" data-led="gen-${i}" cx="${6 + i * 4}" cy="7.5" r="1"/>`).join('') +
      Array.from({ length: 6 }, (_, i) => `<rect class="fig-slot" x="${30 + i * 3}" y="4" width="1.6" height="7" rx="0.5"/>`).join('') +
      `<circle class="fig-screw" cx="2" cy="2" r="0.55"/><circle class="fig-screw" cx="${GEN.w - 2}" cy="2" r="0.55"/>` +
      `</g>`,
  );
  return out.join('');
}

// ---------- p99 dial gauge on a stand ----------
function gauge() {
  const out = [];
  const [x, y] = GAUGE;
  const base = { x: x - 11, y: y - 11, w: 22, d: 22, r: 3 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(base, 0, 6, P, 5, 0.6), { tone: 'mid' }));
  out.push(D(k.corners(base, 3.5).map(([cx, cy]) => at([cx, cy, 6])), { size: 0.45 }));
  out.push(S(k.cylinder(x, y, 2.6, 6, GAUGE_Z - 6, P, 20), { tone: 'mid', crease: 'none' }));
  out.push(L([18, 30].map((zz) => k.sideArc(x, y, 2.6, zz, P, 12)).join(''), { tone: 'faint' }));
  out.push(S(k.cylinder(x, y, GAUGE_R, GAUGE_Z, GAUGE_H, P, 64, 0.8), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.knurl(x, y, GAUGE_R, GAUGE_TOP - 3, GAUGE_TOP, 80, P, 0.3), { tone: 'lo' }));
  out.push(L(k.sideArc(x, y, GAUGE_R, GAUGE_TOP - 3, P, 40), { tone: 'faint' })); // the knurl's lower seam
  out.push(L(k.ring(x, y, GAUGE_R - 2, GAUGE_TOP, P, 64), { tone: 'lo' }));
  const ticks = k.radialTicks(x, y, GAUGE_R - 2, 40, 5, GAUGE_TOP, [1.2, 2.6], P); // start on the ring
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(L(k.ring(x, y, 1.5, GAUGE_TOP, P, 16), { tone: 'mid' }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + 8], GAUGE_TOP, P, 'x'), 'p99 ms', { size: 2.6, tone: 'lo', anchor: 'middle' }));
  out.push(`<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="" style="stroke-width:1.2"/>`);
  return out.join('');
}

// ---------- assemble (back to front) ----------
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    'A server rack on a load bench. A traffic generator with a knob feeds a cable into the load balancer at the top of the rack; patch cables run down the side to five app server blades, a cache and two database units. Each unit has a meter on its front showing how busy it is, and a dial gauge on a stand reads the p99 latency.',
  body: [bench(), gauge(), rackBack(), ...UNITS.map(unitSvg), rackFront(), cables(), generator()],
});

const meta = {
  P,
  knob: { at: KNOB, r: KNOB_R - 1.4, z: GEN_H + 6.3 },
  gauge: { at: GAUGE, r: GAUGE_R - 4, z: GAUGE_TOP + 0.2 },
  meters: Object.fromEntries(UNITS.filter((u) => u.kind !== 'lb').map((u) => [u.id, u.kind === 'svc' ? 18 : u.kind === 'cache' ? 12 : 10])),
};

mkdirSync(join(ROOT, 'src/site/figure'), { recursive: true });
writeFileSync(
  join(ROOT, 'src/site/figure/rack.generated.js'),
  `// Generated by scripts/build-rack-figure.mjs. Do not edit by hand.\nexport const RACK_SVG = ${JSON.stringify(svg)};\nexport const RACK_META = ${JSON.stringify(meta)};\n`,
);
console.log('wrote src/site/figure/rack.generated.js', `${(svg.length / 1024).toFixed(0)} KB`);

const previewAt = process.argv.indexOf('--preview');
if (previewAt > 0) {
  const css = (await import('node:fs')).readFileSync(join(ROOT, 'src/site/iso/iso.css'), 'utf8') + (await import('node:fs')).readFileSync(join(ROOT, 'src/site/figure/rack.css'), 'utf8');
  writeFileSync(process.argv[previewAt + 1], `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#0b0e11}${css}</style><div class="iso fig-rack" style="max-width:900px;margin:auto">${svg}</div>`);
  console.log('wrote preview');
}
