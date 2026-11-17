// The hero figure, drawn with the anatomy kit (MIT, github.com/wheresryan22/anatomy; vendored in
// src/site/iso). buildRackScene({ racks, tier }) returns the SVG for `racks` servers side by side
// (scale out) whose app blades and databases grow with `tier` (scale up: more RAM, more drives).
// The camera refits to every layout, so adding racks shrinks them and removing racks enlarges
// them without ever leaving the card. Meters, LEDs, knob, needle and pulses are moved live by
// RackFigure.jsx from analyze.js.

import * as k from '../iso/iso-kit.mjs';

export const WIDTH = 640;
export const HEIGHT = 560;
export const MAX_RACKS = 4;
export const MAX_TIER = 4;
export const RAM_GB = [16, 32, 64, 128];
export const DISK_TB = [2, 4, 8, 16];
export const BLADES_PER_RACK = 4;

const RACK_W = 74;
const RACK_D = 52;
const RACK_GAP = 34;
const POST = 4;
const PLINTH_H = 6;
const GAP = 1.6;
const BENCH_H = 10;
const FOOT_H = 6;
const GEN_H = 15;
const KNOB_R = 7;
const GAUGE_Z = 46;
const GAUGE_R = 17;
const GAUGE_H = 8;
const GAUGE_TOP = GAUGE_Z + GAUGE_H;
const tenth = (v) => Math.round(v * 10) / 10;

function unitsFor(tier) {
  const svcH = 7 + (tier - 1) * 2.4;
  const dbH = 15 + (tier - 1) * 3.2;
  const units = [
    { key: 'db', label: `DB · ${DISK_TB[tier - 1]} TB`, h: dbH, kind: 'db' },
    { key: 'cache', label: 'CACHE', h: 11, kind: 'cache' },
    ...Array.from({ length: BLADES_PER_RACK }, (_, i) => ({ key: `svc-${i + 1}`, label: `APP · ${RAM_GB[tier - 1]} GB`, h: svcH, kind: 'svc' })),
    { key: 'switch', label: 'SWITCH', h: 9, kind: 'switch' },
  ];
  let z = PLINTH_H + GAP;
  for (const u of units) {
    u.z = z;
    z += u.h + GAP;
  }
  return { units, top: z + 1 };
}

export function buildRackScene({ racks = 1, tier = 1 } = {}) {
  const { units, top: RACK_TOP } = unitsFor(tier);
  const span = racks * RACK_W + (racks - 1) * RACK_GAP;
  const x0 = -span / 2 - 20;
  const rackAt = (i) => ({ x: x0 + i * (RACK_W + RACK_GAP), y: -26, w: RACK_W, d: RACK_D });
  const last = rackAt(racks - 1);
  const GEN = { x: last.x + RACK_W - 26, y: 34, w: 50, d: 36, r: 3 };
  const KNOB = [GEN.x + 36, GEN.y + 18];
  const GAUGE = [last.x + RACK_W + 44, -40];
  const BENCH = { x: x0 - 46, y: -76, w: GAUGE[0] + 34 - (x0 - 46), d: 160, r: 6 };

  const P = k.fitProjection(
    [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), ...Array.from({ length: racks }, (_, i) => k.boxCorners(rackAt(i), 0, RACK_TOP + 22)).flat(), [GAUGE[0], GAUGE[1], GAUGE_TOP + 2]],
    WIDTH,
    HEIGHT,
    { pad: 12, azimuth: 42 },
  );
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);

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
    const strip = { x: BENCH.x + 14, y: BENCH.y + BENCH.d - 13, w: Math.min(150, BENCH.w * 0.5), d: 7, r: 1 };
    out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
    // ticks hang from the strip's back edge; majors cross the whole strip so both ends land on its outline
    const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y, 0.6, [2, strip.d + 0.3], P);
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
    out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
    const plateX = BENCH.x + BENCH.w * 0.52;
    out.push(
      `<g transform="${k.sideMatrix([plateX, BENCH.y + BENCH.d], -1.8, P, 'left')}">` +
        `<rect class="fig-plate" x="0" y="0" width="58" height="6.4"/>` +
        `<text class="fig-engrave" x="3" y="4.4" font-size="3">LOAD BENCH · TW-1</text>` +
        `<circle class="fig-screw" cx="1.4" cy="3.2" r="0.6"/><circle class="fig-screw" cx="56.6" cy="3.2" r="0.6"/>` +
        `</g>`,
    );
    return out.join('');
  }

  // ---------- one rack ----------
  function rack(i) {
    const R = rackAt(i);
    const FRONT_Y = R.y + R.d;
    const SIDE_X = R.x + R.w;
    const UNIT = { x: R.x + POST, y: R.y + 2, w: R.w - POST * 2, d: R.d - 2 };
    const onFront = (x, zTop, children) => `<g transform="${k.sideMatrix([x, FRONT_Y], zTop, P, 'left')}">${children}</g>`;
    const post = (plan) => S(k.slabOf(plan, PLINTH_H, RACK_TOP - PLINTH_H, P, 3, 0.3), { tone: 'mid' });
    const posts = {
      backLeft: { x: R.x, y: R.y, w: POST, d: POST, r: 0.6 },
      backRight: { x: R.x + R.w - POST, y: R.y, w: POST, d: POST, r: 0.6 },
      frontLeft: { x: R.x, y: FRONT_Y - POST, w: POST, d: POST, r: 0.6 },
      frontRight: { x: R.x + R.w - POST, y: FRONT_Y - POST, w: POST, d: POST, r: 0.6 },
    };
    const out = [`<path class="iso-halo" d="${k.haloOf({ ...R, r: 1.2 }, 0, 0.1, P)}" style="filter:blur(6px)"/>`];
    out.push(S(k.slabOf({ ...R, r: 1.2 }, 0, PLINTH_H, P, 4, 0.6), { tone: 'lo' }));
    out.push(onFront(R.x, PLINTH_H, Array.from({ length: 12 }, (_, s) => `<rect class="fig-slot" x="${8 + s * 5}" y="2" width="2.6" height="2" rx="0.6"/>`).join('')));
    out.push(post(posts.backLeft), post(posts.backRight));

    const meter = (u, id, width) => {
      const y = u.h / 2 - 1.3;
      const x = UNIT.w - width - 9;
      return (
        `<rect class="fig-track" x="${x}" y="${tenth(y)}" width="${width}" height="2.6" rx="0.6"/>` +
        `<rect class="fig-meter" data-meter="${id}" data-full="${width}" x="${x}" y="${tenth(y)}" width="0" height="2.6" rx="0.6"/>` +
        `<circle class="fig-led" data-led="${id}" cx="${UNIT.w - 5}" cy="${tenth(u.h / 2)}" r="1.15"/>`
      );
    };
    for (const u of units) {
      const id = `${u.kind}-r${i}-${u.key}`;
      out.push(S(k.slabOf({ ...UNIT, r: 0.8 }, u.z, u.h, P, 3, 0.5), { tone: u.kind === 'svc' ? 'hi' : 'mid', crease: 'lo' }));
      const face = [
        `<circle class="fig-screw" cx="1.8" cy="${tenth(u.h / 2)}" r="0.55"/>`,
        `<circle class="fig-screw" cx="${UNIT.w - 1.8}" cy="${tenth(u.h / 2)}" r="0.55"/>`,
        `<text class="fig-engrave" x="4.5" y="${tenth(u.h / 2 + 1.1)}" font-size="${u.h > 8 ? 3 : 2.6}">${u.label}</text>`,
      ];
      if (u.kind === 'db') {
        const bays = 2 + tier * 2;
        const bw = Math.min(6, 28 / bays * 1.2);
        for (let b = 0; b < bays; b++) face.push(`<rect class="fig-bay" x="${tenth(24 + b * (bw + 1))}" y="2.2" width="${tenth(bw)}" height="${tenth(u.h - 4.4)}" rx="0.5"/><circle class="fig-bay-led" cx="${tenth(24 + b * (bw + 1) + bw / 2)}" cy="${tenth(u.h - 3.4)}" r="0.5"/>`);
        face.push(meter(u, id, 8));
      } else if (u.kind === 'cache') {
        for (let s = 0; s < 8; s++) face.push(`<rect class="fig-slot" x="${22 + s * 3.4}" y="2.4" width="1.6" height="${u.h - 4.8}" rx="0.5"/>`);
        face.push(meter(u, id, 12));
      } else if (u.kind === 'switch') {
        for (let s = 0; s < 6; s++) face.push(`<rect class="fig-port" x="${24 + s * 3.6}" y="2.4" width="2.6" height="2.4" rx="0.3"/>`);
        face.push(`<circle class="fig-led" data-led="switch-r${i}" cx="${UNIT.w - 5}" cy="${tenth(u.h / 2)}" r="1.15"/>`);
      } else {
        // memory: one DIMM stick per 16 GB step of the tier
        const sticks = tier * 2;
        for (let s = 0; s < sticks; s++) face.push(`<rect class="fig-dimm" x="${tenth(27 + s * 2.2)}" y="1.6" width="1.4" height="${tenth(u.h - 3.2)}" rx="0.3"/>`);
        face.push(meter(u, id, 14));
      }
      out.push(onFront(UNIT.x, u.z + u.h, face.join('')));
    }

    out.push(post(posts.frontLeft), post(posts.frontRight));
    for (const x of [R.x + 2, R.x + R.w - 2]) {
      const holes = [];
      for (let zz = PLINTH_H + 4; zz < RACK_TOP - 2; zz += 5) holes.push(at([x, FRONT_Y, zz]));
      out.push(D(holes, { size: 0.42, tone: 'lo' }));
    }
    const cap = { x: R.x - 1, y: R.y - 1, w: R.w + 2, d: R.d + 2, r: 1.5 };
    out.push(S(k.slabOf(cap, RACK_TOP, 3, P, 4, 0.6), { tone: 'mid' }));
    // vent slots run from one side of the inset frame to the other, so both ends land on it
    const frame = k.insetPlan(cap, 4);
    out.push(L(k.planOutline(frame, RACK_TOP + 3, P), { tone: 'lo' }));
    for (let s = 0; s < 9; s++) {
      const x = R.x + 10 + s * 6;
      out.push(L(k.lineOnTop([x, frame.y], [x, frame.y + frame.d], RACK_TOP + 3, P), { tone: 'faint' }));
    }
    out.push(D(k.corners(cap, 3).map(([x, y]) => at([x, y, RACK_TOP + 3])), { size: 0.45 }));

    // patch cables down the visible side
    const midZ = (key) => {
      const u = units.find((v) => v.key === key);
      return u.z + u.h / 2;
    };
    const port = (y, zz) => [SIDE_X + 0.8, y, zz];
    for (let b = 0; b < BLADES_PER_RACK; b++) {
      const y = -18 + b * 5;
      out.push(k.wireSvg(at(port(y, midZ('switch'))), at(port(y, midZ(`svc-${b + 1}`))), { tone: 'mid' }));
    }
    out.push(k.wireSvg(at(port(6, midZ('svc-2'))), at(port(6, midZ('cache'))), { tone: 'mid' }));
    out.push(k.wireSvg(at(port(14, midZ('cache'))), at(port(14, midZ('db'))), { tone: 'mid' }));
    return out.join('');
  }

  // ---------- links between racks: an arched uplink from cap to cap ----------
  function uplinks() {
    const out = [];
    for (let i = 0; i < racks - 1; i++) {
      const a = rackAt(i);
      const b = rackAt(i + 1);
      const from = [a.x + a.w - 10, a.y + 12, RACK_TOP + 3];
      const to = [b.x + 10, b.y + 12, RACK_TOP + 3];
      const lift = RACK_TOP + 16;
      out.push(k.wireSvg(at(from), at(to), { tone: 'hi', via: [at([from[0], from[1], lift]), at([to[0], to[1], lift])] }));
    }
    return out.join('');
  }

  // ---------- traffic generator and its feed into the nearest rack's switch ----------
  function generator() {
    const switchZ = units.find((u) => u.key === 'switch');
    const portAt = [last.x + RACK_W + 0.8, 10, switchZ.z + switchZ.h / 2];
    const from = [GEN.x + 8, GEN.y + 10, GEN_H];
    const lift = GEN_H + 14;
    const d = k.pathOf([at(from), at([from[0], from[1], lift]), at([portAt[0] + 10, portAt[1], lift]), at([portAt[0] + 10, portAt[1], portAt[2]]), at(portAt)]);
    const end = ([x, y]) => `<circle class="iso-wire-end" cx="${tenth(x)}" cy="${tenth(y)}" r="1.2"/>`;
    const out = [`<g class="iso-wire" data-tone="hi">${L(d, { tone: 'hi' })}${end(at(from))}${end(at(portAt))}</g>`];
    out.push(`<path data-part="feed" d="${d}" fill="none" stroke="none"/>`, `<g data-part="pulses"></g>`);
    out.push(`<path class="iso-halo" d="${k.haloOf(GEN, 0, 0.1, P)}" style="filter:blur(5px)"/>`);
    out.push(S(k.slabOf(GEN, 0, GEN_H, P, 5, 0.7), { tone: 'mid' }));
    out.push(L(k.planOutline(k.insetPlan(GEN, 3), GEN_H, P), { tone: 'faint' }));
    out.push(D([at([GEN.x + 4, GEN.y + 4, GEN_H]), at([GEN.x + GEN.w - 4, GEN.y + 4, GEN_H]), at([GEN.x + 4, GEN.y + GEN.d - 4, GEN_H])], { size: 0.45 }));
    out.push(k.faceTextSvg(k.topMatrix([GEN.x + 6, GEN.y + 30], GEN_H, P, 'x'), 'TRAFFIC', { size: 3, tone: 'mid' }));
    out.push(S(k.cylinder(KNOB[0], KNOB[1], KNOB_R + 2, GEN_H, 1.2, P, 40), { tone: 'lo' }));
    out.push(L(k.ring(KNOB[0], KNOB[1], KNOB_R + 1.6, GEN_H + 1.2, P, 40), { tone: 'lo' }));
    const ticks = k.radialTicks(KNOB[0], KNOB[1], KNOB_R + 1.6, 20, 5, GEN_H + 1.2, [0.8, 1.6], P);
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
    out.push(S(k.cylinder(KNOB[0], KNOB[1], KNOB_R, GEN_H + 1.2, 5, P, 40, 0.5), { tone: 'hi', crease: 'lo' }));
    out.push(L(k.knurl(KNOB[0], KNOB[1], KNOB_R, GEN_H + 1.6, GEN_H + 6.2, 44, P, 0.3), { tone: 'lo' }));
    out.push(L(k.sideArc(KNOB[0], KNOB[1], KNOB_R, GEN_H + 1.6, P, 32), { tone: 'faint' }));
    out.push(`<path data-part="knob" class="iso-line" data-tone="lit" data-free="start" d="" style="stroke-width:1.2"/>`);
    out.push(
      `<g transform="${k.sideMatrix([GEN.x, GEN.y + GEN.d], GEN_H, P, 'left')}">` +
        Array.from({ length: 5 }, (_, s) => `<circle class="fig-led" data-led="gen-${s}" cx="${6 + s * 4}" cy="7.5" r="1"/>`).join('') +
        Array.from({ length: 6 }, (_, s) => `<rect class="fig-slot" x="${30 + s * 3}" y="4" width="1.6" height="7" rx="0.5"/>`).join('') +
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
    out.push(L(k.sideArc(x, y, GAUGE_R, GAUGE_TOP - 3, P, 40), { tone: 'faint' }));
    out.push(L(k.ring(x, y, GAUGE_R - 2, GAUGE_TOP, P, 64), { tone: 'lo' }));
    const ticks = k.radialTicks(x, y, GAUGE_R - 2, 40, 5, GAUGE_TOP, [1.2, 2.6], P);
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
    out.push(L(k.ring(x, y, 1.5, GAUGE_TOP, P, 16), { tone: 'mid' }));
    out.push(k.faceTextSvg(k.topMatrix([x, y + 8], GAUGE_TOP, P, 'x'), 'p99 ms', { size: 2.6, tone: 'lo', anchor: 'middle' }));
    out.push(`<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="" style="stroke-width:1.2"/>`);
    return out.join('');
  }

  // back to front: bench, gauge (behind the last rack), racks in depth order, uplinks, generator
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: `A load bench carrying ${racks} server rack${racks > 1 ? 's' : ''} side by side, each with a switch, ${BLADES_PER_RACK} app servers with ${RAM_GB[tier - 1]} GB of memory, a cache and a ${DISK_TB[tier - 1]} TB database${racks > 1 ? ', linked to each other by cables across their tops' : ''}. A traffic generator with a knob feeds the nearest rack, and a dial gauge reads p99 latency.`,
    body: [bench(), gauge(), ...Array.from({ length: racks }, (_, i) => rack(i)), uplinks(), generator()],
  });

  return {
    svg,
    meta: {
      P,
      knob: { at: KNOB, r: KNOB_R - 1.4, z: GEN_H + 6.3 },
      gauge: { at: GAUGE, r: GAUGE_R - 4, z: GAUGE_TOP + 0.2 },
    },
  };
}
