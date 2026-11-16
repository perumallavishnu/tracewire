import { useEffect, useRef } from 'react';
import { lineOnTop } from '../iso/iso-kit.mjs';
import { analyzeDesign } from '../../simulation/analyze';
import { buildDemoGraph } from '../demoModel';
import { formatQps } from '../../utils/format';
import { RACK_SVG, RACK_META } from './rack.generated';
import '../iso/iso.css';
import './rack.css';

// Live layer for the rack figure. The static drawing is generated at build time
// (scripts/build-rack-figure.mjs); this only moves the parts that change: meter fills,
// LEDs, the knob pointer, the p99 needle and request pulses on the feed cable.

const MIN = 1000;
const MAX = 120000;
const GRAPH = buildDemoGraph({ cache: true, services: 5, dbs: 2 });
const TOUR = [4000, 20000, 48000, 90000, 20000];
const share = (t) => Math.log(t / MIN) / Math.log(MAX / MIN);
const fromShare = (s) => MIN * Math.pow(MAX / MIN, Math.min(1, Math.max(0, s)));
const stateOf = (u) => (u > 1 ? 'error' : u > 0.8 ? 'warn' : 'ok');

function pointer(at, turn, r, z) {
  const a = turn * Math.PI * 2;
  const [x, y] = at;
  return lineOnTop([x - Math.sin(a) * 2.6, y + Math.cos(a) * 2.6], [x + Math.sin(a) * r, y - Math.cos(a) * r], z, RACK_META.P);
}

export default function RackFigure() {
  const stageRef = useRef(null);
  const readoutRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const readout = readoutRef.current; // kept: React clears the ref before this effect's cleanup runs
    let alive = true;
    const svg = stage.querySelector('svg');
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
    const pulseDots = Array.from({ length: 14 }, () => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', '1.6');
      c.setAttribute('class', 'fig-pulse');
      parts.pulses.appendChild(c);
      return c;
    });

    let traffic = TOUR[1];
    let target = traffic;
    let touring = !still.matches;
    let clock = 0;
    let phase = 0;
    let last = 0;
    let frame = 0;
    let visible = false;
    let idleTimer = 0;
    let lastKey = '';
    let needleTurn = 0;

    function apply() {
      const a = analyzeDesign(GRAPH, { entryQps: traffic });
      const util = { svc: a.nodes.svc.utilization, cache: a.nodes.cache.utilization, db: a.nodes.db.utilization };
      for (const m of parts.meters) {
        const id = m.dataset.meter;
        const u = id.startsWith('svc') ? util.svc : id === 'cache' ? util.cache : util.db;
        const width = RACK_META.meters[id] * Math.min(1, u);
        m.setAttribute('width', width.toFixed(2));
        m.dataset.state = stateOf(u);
      }
      const lit = Math.ceil(share(traffic) * 5);
      for (const led of parts.leds) {
        const id = led.dataset.led;
        let state;
        if (id.startsWith('gen-')) state = Number(id.slice(4)) < lit ? (traffic > 60000 ? 'warn' : 'ok') : 'off';
        else if (id === 'lb') state = a.errorRate > 0.05 ? 'warn' : 'ok';
        else state = stateOf(id.startsWith('svc') ? util.svc : id === 'cache' ? util.cache : util.db);
        led.dataset.state = state;
      }
      parts.knob.setAttribute('d', pointer(RACK_META.knob.at, -0.38 + share(traffic) * 0.76, RACK_META.knob.r, RACK_META.knob.z));
      return a;
    }

    function draw(dt) {
      const a = apply();
      // the needle follows p99 like a damped instrument: 0 to 400 ms over 0.8 of a turn
      const want = Math.min(400, a.p99Ms) / 400 * 0.8 - 0.4;
      needleTurn = still.matches ? want : needleTurn + (want - needleTurn) * (1 - Math.exp(-dt / 0.35));
      parts.needle.setAttribute('d', pointer(RACK_META.gauge.at, needleTurn, RACK_META.gauge.r, RACK_META.gauge.z));
      // request pulses: more and faster with traffic; red once requests start failing
      const count = Math.max(2, Math.round(share(traffic) * pulseDots.length));
      phase = (phase + dt * (0.18 + share(traffic) * 0.5)) % 1;
      pulseDots.forEach((dot, i) => {
        if (i >= count || still.matches) {
          dot.setAttribute('opacity', '0');
          return;
        }
        const t = (phase + i / count) % 1;
        const p = parts.feed.getPointAtLength(t * feedLength);
        dot.setAttribute('cx', p.x.toFixed(1));
        dot.setAttribute('cy', p.y.toFixed(1));
        dot.setAttribute('opacity', String(Math.min(1, t * 6, (1 - t) * 6)));
        dot.style.fill = a.errorRate > 0.05 ? '#e5484d' : '';
      });
      const text = `${formatQps(traffic)} req/s · p99 ${Math.round(a.p99Ms)} ms · apps at ${Math.round(a.nodes.svc.utilization * 100)}%`;
      if (text !== lastKey) {
        lastKey = text;
        readout.textContent = text;
        stage.setAttribute('aria-valuetext', text);
        stage.setAttribute('aria-valuenow', String(Math.round(traffic)));
      }
    }

    function tick(now) {
      if (!alive) return;
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      if (touring) {
        clock += dt;
        target = TOUR[Math.floor(clock / 3.2) % TOUR.length];
      }
      traffic = still.matches ? target : traffic + (target - traffic) * (1 - Math.exp(-dt / 0.6));
      draw(dt);
      frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
    }
    const run = () => {
      if (!frame && visible) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const steer = (next) => {
      touring = false;
      target = Math.min(MAX, Math.max(MIN, next));
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        touring = !still.matches;
        clock = 0;
        run();
      }, 4000);
      if (still.matches) draw(1);
      run();
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) run();
    }, { rootMargin: '80px 0px' });
    io.observe(stage);

    const onMove = (e) => {
      const box = svg.getBoundingClientRect();
      steer(fromShare(((e.clientX - box.left) / box.width - 0.15) / 0.7));
    };
    const onKey = (e) => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (e.key === 'Home') steer(MIN);
      else if (e.key === 'End') steer(MAX);
      else if (step) steer(fromShare(share(target) + step * 0.08));
      else return;
      e.preventDefault();
    };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('keydown', onKey);
    draw(1);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer);
      io.disconnect();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <figure className="rack-card">
      <div className="rack-card__head">
        <span>Fig 1</span>
        <span>One rack under load</span>
      </div>
      <div
        ref={stageRef}
        className="iso fig-rack rack-card__stage"
        tabIndex={0}
        role="slider"
        aria-label="Traffic into the rack. Move the pointer across the figure, or use the arrow keys, to change the request rate."
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        dangerouslySetInnerHTML={{ __html: RACK_SVG }}
      />
      <figcaption className="rack-card__foot">
        <span>Move across the rack to change the traffic</span>
        <output ref={readoutRef} aria-live="off" />
      </figcaption>
    </figure>
  );
}
