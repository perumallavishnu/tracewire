import { useMemo } from 'react';
import {
  AlertTriangle, CloudOff, Database, DatabaseZap, HardDrive, Monitor, Server, ServerCrash, Split, Unplug, Users, Zap,
} from 'lucide-react';
import * as k from '../iso/iso-kit.mjs';
import '../iso/iso.css';
import './rack.css';

// Three isometric platforms: unsorted, failing machines on the left; a pipeline whose
// four gates are the principles that fix them; a working architecture on the right.
// Requests ride from left to right and change from red to amber to signal teal as
// they clear the gates. Platforms come from the anatomy kit; icons are Lucide (ISC).

const W = 1200;
const H = 330;
const PLAT = 150;
const TOP = 10;
const LEFT_C = [-200, 200];
const RIGHT_C = [200, -200];
// with the camera at 45°, u = x - y runs across the screen and v = x + y runs down it
const uv = (u, v) => [(u + v) / 2, (v - u) / 2];
const GATES = [
  { t: 0.22, label: 'Load balance' },
  { t: 0.42, label: 'Cache' },
  { t: 0.62, label: 'Replicate' },
  { t: 0.82, label: 'Queue' },
];
const RED = '#e5484d';
const AMBER = '#f5a623';
const TEAL = '#4fd1c5';

const BROKEN = [
  { Icon: ServerCrash, at: uv(-505, -10), delay: 0 },
  { Icon: Database, at: uv(-455, 48), delay: 0.3, x: true },
  { Icon: Unplug, at: uv(-440, -52), delay: 0.6 },
  { Icon: Monitor, at: uv(-385, 8), delay: 0.15, x: true },
  { Icon: CloudOff, at: uv(-335, -46), delay: 0.45 },
  { Icon: HardDrive, at: uv(-318, 50), delay: 0.75, x: true },
  { Icon: DatabaseZap, at: uv(-270, 2), delay: 0.9 },
];

// the working side: users -> load balancer -> three app servers -> cache -> two databases
const BUILT = {
  users: uv(285, 0),
  lb: uv(340, 0),
  svc: [uv(392, -78), uv(408, 0), uv(392, 78)],
  cache: uv(460, 0),
  db: [uv(515, -44), uv(515, 44)],
};

function plan([cx, cy], size) {
  return { x: cx - size / 2, y: cy - size / 2, w: size, d: size, r: 6 };
}

function buildScene() {
  const P = k.fitProjection(
    [...k.boxCorners(plan(LEFT_C, PLAT), -8, TOP + 48), ...k.boxCorners(plan(RIGHT_C, PLAT), -8, TOP + 48)],
    W, H, { pad: 12, azimuth: 45 },
  );
  const at = (p) => k.iso(p, P);
  const parts = [];
  // platforms
  for (const [c, tone] of [[LEFT_C, 'lo'], [RIGHT_C, 'mid']]) {
    const p = plan(c, PLAT);
    parts.push(`<path class="iso-halo" d="${k.haloOf(p, -8, TOP + 8, P)}"/>`);
    parts.push(k.solidSvg(k.slabOf(p, -8, TOP + 8, P, 8, 1.2), { tone }));
    parts.push(k.lineSvg(k.planOutline(k.insetPlan(p, 6), TOP, P), { tone: 'lo' }));
    parts.push(k.dotsSvg(k.corners(p, 12).map(([x, y]) => at([x, y, TOP])), { size: 0.55 }));
  }
  // the pipeline: a slab along the diagonal between the two platforms
  const a = [LEFT_C[0] + PLAT / 2 - 6, LEFT_C[1] - PLAT / 2 + 6];
  const b = [RIGHT_C[0] - PLAT / 2 + 6, RIGHT_C[1] + PLAT / 2 - 6];
  const n = [Math.SQRT1_2 * 16, Math.SQRT1_2 * 16];
  const ring = [[a[0] - n[0], a[1] - n[1]], [b[0] - n[0], b[1] - n[1]], [b[0] + n[0], b[1] + n[1]], [a[0] + n[0], a[1] + n[1]]];
  parts.push(k.solidSvg(k.extrude(ring, -2, 8, P), { tone: 'mid' }));
  const along = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  parts.push(k.lineSvg(k.lineOnTop(along(0.02), along(0.98), 6, P), { tone: 'faint' }));
  // gates: two posts and a lintel across the pipe at each principle
  const gates = GATES.map((g) => {
    const c = along(g.t);
    const l = [c[0] - n[0] * 1.35, c[1] - n[1] * 1.35];
    const r = [c[0] + n[0] * 1.35, c[1] + n[1] * 1.35];
    const posts = [l, r].sort((p, q) => k.depthOf([...p, 0], P) - k.depthOf([...q, 0], P));
    const lintel = [[l[0] - 2, l[1] + 2], [r[0] - 2, r[1] + 2], [r[0] + 2, r[1] - 2], [l[0] + 2, l[1] - 2]];
    return {
      back: k.solidSvg(k.cylinder(posts[0][0], posts[0][1], 2.6, 6, 30, P, 20), { tone: 'mid' }),
      front: k.solidSvg(k.cylinder(posts[1][0], posts[1][1], 2.6, 6, 30, P, 20), { tone: 'mid' }) + k.solidSvg(k.extrude(lintel, 36, 4, P), { tone: 'hi', lit: true }),
      ...g,
      labelAt: at([c[0], c[1], 46]),
    };
  });
  // dead cables on the left: broken dashed runs between the failing machines
  const dead = [[BROKEN[0].at, BROKEN[3].at], [BROKEN[3].at, BROKEN[4].at], [BROKEN[2].at, BROKEN[5].at]]
    .map(([p, q]) => k.lineOnTop(p, [p[0] + (q[0] - p[0]) * 0.55, p[1] + (q[1] - p[1]) * 0.55], TOP, P));
  // live connections on the right
  const link = (p, q) => k.lineOnTop(p, q, TOP, P);
  const links = [
    link(BUILT.users, BUILT.lb),
    ...BUILT.svc.map((s) => link(BUILT.lb, s)),
    ...BUILT.svc.map((s) => link(s, BUILT.cache)),
    ...BUILT.db.map((d) => link(BUILT.cache, d)),
  ];
  // the request route: off the left platform, along the pipe, onto the load balancer
  const route = k.pathOf([at([...LEFT_C, TOP]), at([...along(0), 6]), at([...along(1), 6]), at([...BUILT.lb, TOP])]);
  const icon = (p) => at([p[0], p[1], TOP]);
  return {
    P,
    static: parts.join(''),
    gates,
    dead,
    links,
    route,
    broken: BROKEN.map((b) => ({ ...b, xy: icon(b.at) })),
    built: {
      users: icon(BUILT.users),
      lb: icon(BUILT.lb),
      svc: BUILT.svc.map(icon),
      cache: icon(BUILT.cache),
      db: BUILT.db.map(icon),
    },
    // caption anchors: centre of each object, as a share of the drawing's width
    anchors: [at([...LEFT_C, 0])[0], at([...along(0.5), 0])[0], at([...RIGHT_C, 0])[0]].map((x) => (x / W) * 100),
  };
}

// An icon standing on the platform: placed by the outer group, animated by the inner one
// (a CSS animation would otherwise replace the placing transform).
function Glyph({ Icon, xy, size = 30, color, className = '', style }) {
  return (
    <g transform={`translate(${xy[0]} ${xy[1] - size * 0.9})`}>
      <g className={`bb-glyph ${className}`} style={style}>
        <rect x={-size * 0.62} y={-size * 0.12} width={size * 1.24} height={size * 1.24} rx="4" className="bb-glyph__plate" />
        <Icon x={-size / 2} y={0} width={size} height={size} color={color} strokeWidth={1.6} />
      </g>
    </g>
  );
}

export default function BrokenToBuilt() {
  const s = useMemo(buildScene, []);
  const gateTimes = GATES.map((g) => g.t);
  const packets = [0, 1, 2, 3, 4, 5];

  return (
    <div className="iso fig-rack bb">
      <p className="bb__swipe" aria-hidden="true">Swipe to follow the requests</p>
      <div className="bb__scroller" tabIndex={0} aria-label="Broken to built scene, scrolls sideways on small screens">
      <svg className="iso-svg bb__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="On the left, unsorted servers, databases and machines fail in red with broken cables. Requests travel along a pipeline through four gates, load balance, cache, replicate and queue, turning from red to amber to teal, and arrive at a working architecture on the right: users, a load balancer, three app servers, a cache and two databases, all connected.">
        <g dangerouslySetInnerHTML={{ __html: s.static }} />
        {s.gates.map((g) => <g key={`b-${g.label}`} dangerouslySetInnerHTML={{ __html: g.back }} />)}
        <path id="bb-route" d={s.route} fill="none" stroke="none" />
        {packets.map((i) => (
          <circle key={i} r="5" className="bb-packet">
            <animateMotion dur="6s" begin={`${-i}s`} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href="#bb-route" />
            </animateMotion>
            <animate
              attributeName="fill"
              dur="6s"
              begin={`${-i}s`}
              repeatCount="indefinite"
              values={`${RED};${RED};${AMBER};${AMBER};${TEAL};${TEAL}`}
              keyTimes={`0;${(0.12 + gateTimes[0] * 0.7).toFixed(2)};${(0.14 + gateTimes[1] * 0.7).toFixed(2)};${(0.12 + gateTimes[2] * 0.7).toFixed(2)};${(0.14 + gateTimes[3] * 0.7).toFixed(2)};1`}
            />
          </circle>
        ))}
        {s.gates.map((g) => (
          <g key={`f-${g.label}`}>
            <g dangerouslySetInnerHTML={{ __html: g.front }} />
            <text x={g.labelAt[0]} y={g.labelAt[1]} className="bb-gate-label" textAnchor="middle">{g.label}</text>
          </g>
        ))}

        {s.dead.map((d, i) => <path key={`dead-${i}`} d={d} className="bb-dead" />)}
        {s.broken.map((b, i) => (
          <Glyph key={i} Icon={b.Icon} xy={b.xy} color={RED} className="bb-glyph--broken" style={{ animationDelay: `${b.delay}s` }} />
        ))}
        {s.broken.filter((b) => b.x).map((b, i) => (
          <g key={`warn-${i}`} transform={`translate(${b.xy[0] + 12} ${b.xy[1] - 34})`} className="bb-warn">
            <AlertTriangle x={-8} y={-8} width={16} height={16} color={AMBER} strokeWidth={2} />
          </g>
        ))}

        {s.links.map((d, i) => (
          <g key={`link-${i}`}>
            <path d={d} className="bb-link" />
            <circle r="2.4" className="bb-flow">
              <animateMotion dur={`${1.6 + (i % 3) * 0.3}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        ))}
        <Glyph Icon={Users} xy={s.built.users} color={TEAL} />
        <Glyph Icon={Split} xy={s.built.lb} color={TEAL} />
        {s.built.svc.map((xy, i) => <Glyph key={`svc-${i}`} Icon={Server} xy={xy} color={TEAL} size={26} />)}
        <Glyph Icon={Zap} xy={s.built.cache} color={TEAL} size={26} />
        {s.built.db.map((xy, i) => <Glyph key={`db-${i}`} Icon={Database} xy={xy} color={TEAL} size={26} />)}
      </svg>
      </div>
      <div className="bb__captions">
        <div className="bb__caption bb__caption--red" style={{ '--at': `${s.anchors[0]}%` }}>
          <h3>Unsorted machines</h3>
          <p>No balancing, no copies, no buffer. One crash and the whole thing goes dark.</p>
        </div>
        <div className="bb__caption bb__caption--amber" style={{ '--at': `${s.anchors[1]}%` }}>
          <h3>Four principles</h3>
          <p>Each gate is a lesson in the course and a component in the simulator.</p>
        </div>
        <div className="bb__caption bb__caption--teal" style={{ '--at': `${s.anchors[2]}%` }}>
          <h3>A working architecture</h3>
          <p>Users reach a load balancer, three app servers, a cache and two databases.</p>
        </div>
      </div>
    </div>
  );
}
