import { useEffect, useMemo, useRef, useState } from 'react';
import { MoveHorizontal, MoveVertical } from 'lucide-react';
import { lineOnTop } from '../iso/iso-kit.mjs';
import { analyzeDesign } from '../../simulation/analyze';
import { defaultConfigFor } from '../../nodeDefs/nodeTypes';
import { formatQps } from '../../utils/format';
import { buildRackScene, BLADES_PER_RACK, MAX_RACKS, MAX_TIER, RAM_GB } from './rackScene';
import '../iso/iso.css';
import './rack.css';

// Fig 1: drag sideways to scale out (more racks, linked to each other), drag up to scale up
// (more memory and drives per server). The model follows the drawing: racks multiply the
// replicas, the tier multiplies each server's capacity. Traffic tours on its own.

const MIN = 1000;
const MAX = 160000;
const TOUR = [6000, 24000, 60000, 120000, 24000];
const STEP_X = 70; // px of drag per rack
const STEP_Y = 56; // px of drag per tier
const share = (t) => Math.log(t / MIN) / Math.log(MAX / MIN);
const stateOf = (u) => (u > 1 ? 'error' : u > 0.8 ? 'warn' : 'ok');

function graphFor(racks, tier) {
  const node = (id, kind, config) => ({ id, data: { kind, label: id, config } });
  const svc = { ...defaultConfigFor('service'), baseLatencyMs: 15, jitterMs: 10 };
  const db = defaultConfigFor('database');
  return {
    nodes: [
      node('gen', 'generator', { rate: 1 }),
      node('lb', 'loadbalancer', defaultConfigFor('loadbalancer')),
      node('svc', 'service', { ...svc, capacity: svc.capacity * tier, replicas: BLADES_PER_RACK * racks }),
      node('cache', 'cache', { ...defaultConfigFor('cache'), cacheHitRate: 0.85, replicas: racks }),
      node('db', 'database', { ...db, capacity: db.capacity * tier, replicas: racks }),
    ],
    edges: [
      { id: 'a', source: 'gen', target: 'lb', data: { latencyMs: 2 } },
      { id: 'b', source: 'lb', target: 'svc', data: { latencyMs: 2 } },
      { id: 'c', source: 'svc', target: 'cache', data: { latencyMs: 1 } },
      { id: 'd', source: 'cache', target: 'db', data: { latencyMs: 2 } },
    ],
  };
}

function pointer(P, at, turn, r, z) {
  const a = turn * Math.PI * 2;
  const [x, y] = at;
  return lineOnTop([x - Math.sin(a) * 2.6, y + Math.cos(a) * 2.6], [x + Math.sin(a) * r, y - Math.cos(a) * r], z, P);
}

export default function RackFigure() {
  const [racks, setRacks] = useState(1);
  const [tier, setTier] = useState(1);
  const scene = useMemo(() => buildRackScene({ racks, tier }), [racks, tier]);
  const graph = useMemo(() => graphFor(racks, tier), [racks, tier]);
  const stageRef = useRef(null);
  const readoutRef = useRef(null);
  const traffic = useRef(TOUR[1]);
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);

  // live layer: rebinds whenever the drawing is rebuilt
  useEffect(() => {
    const stage = stageRef.current;
    const readout = readoutRef.current; // kept: React clears refs before this effect's cleanup
    const svg = stage.querySelector('svg');
    const { P, knob, gauge } = scene.meta;
    const parts = {
      knob: svg.querySelector('[data-part="knob"]'),
      needle: svg.querySelector('[data-part="needle"]'),
      feed: svg.querySelector('[data-part="feed"]'),
      pulses: svg.querySelector('[data-part="pulses"]'),
      meters: [...svg.querySelectorAll('[data-meter]')],
      leds: [...svg.querySelectorAll('[data-led]')],
    };
    const feedLength = parts.feed.getTotalLength();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dots = Array.from({ length: 14 }, () => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', '1.6');
      c.setAttribute('class', 'fig-pulse');
      parts.pulses.appendChild(c);
      return c;
    });
    let alive = true;
    let frame = 0;
    let last = 0;
    let clock = 0;
    let phase = 0;
    let needleTurn = -0.4;
    let visible = false;
    let lastText = '';

    function draw(dt) {
      const t = traffic.current;
      const a = analyzeDesign(graph, { entryQps: t });
      const util = { svc: a.nodes.svc.utilization, cache: a.nodes.cache.utilization, db: a.nodes.db.utilization };
      for (const m of parts.meters) {
        const kind = m.dataset.meter.split('-')[0];
        const u = util[kind];
        m.setAttribute('width', (Number(m.dataset.full) * Math.min(1, u)).toFixed(2));
        m.dataset.state = stateOf(u);
      }
      const lit = Math.ceil(share(t) * 5);
      for (const led of parts.leds) {
        const id = led.dataset.led;
        let state;
        if (id.startsWith('gen-')) state = Number(id.slice(4)) < lit ? (t > 80000 ? 'warn' : 'ok') : 'off';
        else if (id.startsWith('switch')) state = a.errorRate > 0.05 ? 'warn' : 'ok';
        else state = stateOf(util[id.split('-')[0]]);
        led.dataset.state = state;
      }
      parts.knob.setAttribute('d', pointer(P, knob.at, -0.38 + share(t) * 0.76, knob.r, knob.z));
      const want = (Math.min(400, a.p99Ms) / 400) * 0.8 - 0.4;
      needleTurn = still.matches ? want : needleTurn + (want - needleTurn) * (1 - Math.exp(-dt / 0.35));
      parts.needle.setAttribute('d', pointer(P, gauge.at, needleTurn, gauge.r, gauge.z));
      const count = Math.max(2, Math.round(share(t) * dots.length));
      phase = (phase + dt * (0.18 + share(t) * 0.5)) % 1;
      dots.forEach((dot, i) => {
        if (i >= count || still.matches) {
          dot.setAttribute('opacity', '0');
          return;
        }
        const u = (phase + i / count) % 1;
        const pt = parts.feed.getPointAtLength(u * feedLength);
        dot.setAttribute('cx', pt.x.toFixed(1));
        dot.setAttribute('cy', pt.y.toFixed(1));
        dot.setAttribute('opacity', String(Math.min(1, u * 6, (1 - u) * 6)));
        dot.style.fill = a.errorRate > 0.05 ? '#e5484d' : '';
      });
      const text = `${formatQps(t)} req/s · p99 ${Math.round(a.p99Ms)} ms · apps at ${Math.round(util.svc * 100)}%`;
      if (text !== lastText) {
        lastText = text;
        readout.textContent = text;
      }
    }
    function tick(now) {
      if (!alive) return;
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      clock += dt;
      const target = TOUR[Math.floor(clock / 3.4) % TOUR.length];
      traffic.current += (target - traffic.current) * (1 - Math.exp(-dt / 0.7));
      draw(dt);
      frame = visible ? requestAnimationFrame(tick) : 0;
    }
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible && !frame && !still.matches) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    }, { rootMargin: '80px 0px' });
    io.observe(stage);
    draw(1);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [scene, graph]);

  // drag: sideways scales out, vertical scales up; snaps one step per threshold crossed
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, racks, tier };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const nextRacks = Math.min(MAX_RACKS, Math.max(1, d.racks + Math.round((e.clientX - d.x) / STEP_X)));
    const nextTier = e.pointerType === 'touch' ? d.tier : Math.min(MAX_TIER, Math.max(1, d.tier + Math.round((d.y - e.clientY) / STEP_Y)));
    if (nextRacks !== racks) setRacks(nextRacks);
    if (nextTier !== tier) setTier(nextTier);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };
  const onKeyDown = (e) => {
    const map = {
      ArrowRight: () => setRacks((r) => Math.min(MAX_RACKS, r + 1)),
      ArrowLeft: () => setRacks((r) => Math.max(1, r - 1)),
      ArrowUp: () => setTier((t) => Math.min(MAX_TIER, t + 1)),
      ArrowDown: () => setTier((t) => Math.max(1, t - 1)),
    };
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    }
  };

  return (
    <figure className="rack-card">
      <div className="rack-card__head">
        {/* <span>Fig 1</span> */}
        <span>{racks} server{racks > 1 ? 's' : ''} × {RAM_GB[tier - 1]} GB</span>
      </div>
      <div
        ref={stageRef}
        className={`iso fig-rack rack-card__stage${dragging ? ' is-dragging' : ''}`}
        tabIndex={0}
        role="group"
        aria-label={`Server rack figure: ${racks} servers, ${RAM_GB[tier - 1]} GB each. Drag sideways or press left and right to add or remove servers; drag up or down, or press up and down, to change memory per server.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <div key={`${racks}-${tier}`} className="rack-card__art" dangerouslySetInnerHTML={{ __html: scene.svg }} />
        <span className="rack-card__axis rack-card__axis--x" aria-hidden="true"><MoveHorizontal size={16} /> scale out</span>
        <span className="rack-card__axis rack-card__axis--y" aria-hidden="true"><MoveVertical size={16} /> scale up</span>
      </div>
      <figcaption className="rack-card__foot">
        <div className="rack-card__ctrls">
          <span className="rack-card__ctrl">
            <span>Servers</span>
            <button type="button" onClick={() => setRacks((r) => Math.max(1, r - 1))} disabled={racks <= 1} aria-label="Remove a server">−</button>
            <output>{racks}</output>
            <button type="button" onClick={() => setRacks((r) => Math.min(MAX_RACKS, r + 1))} disabled={racks >= MAX_RACKS} aria-label="Add a server">+</button>
          </span>
          <span className="rack-card__ctrl">
            <span>Memory</span>
            <button type="button" onClick={() => setTier((t) => Math.max(1, t - 1))} disabled={tier <= 1} aria-label="Less memory per server">−</button>
            <output>{RAM_GB[tier - 1]} GB</output>
            <button type="button" onClick={() => setTier((t) => Math.min(MAX_TIER, t + 1))} disabled={tier >= MAX_TIER} aria-label="More memory per server">+</button>
          </span>
        </div>
        <output ref={readoutRef} className="rack-card__readout" />
      </figcaption>
    </figure>
  );
}
