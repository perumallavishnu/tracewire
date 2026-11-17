import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, OctagonX, Server, Split, Users, Zap } from 'lucide-react';
import { analyzeDesign, perReplicaQps } from '../simulation/analyze';
import { buildDemoGraph as buildGraph } from './demoModel';
import { formatQps } from '../utils/format';

// The landing page's live instrument: a five-tier architecture run through the same
// steady-state model the simulator scores with. Every number on screen is computed.

const SCENARIOS = [
  { id: 'cache', label: 'With a cache', note: 'A cache answers 85% of reads before they reach the database.', traffic: 20000, cache: true, services: 5, dbs: 2 },
  { id: 'nocache', label: 'No cache', note: 'Every request lands on the database. Watch it saturate.', traffic: 20000, cache: false, services: 5, dbs: 2 },
  { id: 'spike', label: 'Launch spike', note: 'Four times the traffic on the same five app servers.', traffic: 80000, cache: true, services: 5, dbs: 2 },
];

const P99_TARGET = 200;
const MIN = 500;
const MAX = 200000;
const TICKS = [1000, 10000, 100000];
const toTraffic = (v) => Math.round(MIN * Math.pow(MAX / MIN, v / 100) / 100) * 100;
const toSlider = (t) => (Math.log(t / MIN) / Math.log(MAX / MIN)) * 100;
const toneOf = (u) => (u > 1 ? 'error' : u > 0.8 ? 'warn' : 'signal');
const STATUS = { signal: 'Healthy', warn: 'Hot', error: 'Overloaded' };

function Stepper({ label, hint, value, onChange, min = 1, max = 40 }) {
  return (
    <div className="dial-stepper">
      <div>
        <span className="dial-stepper__label">{label}</span>
        <span className="dial-stepper__hint">{hint}</span>
      </div>
      <div className="dial-stepper__ctrl">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label.toLowerCase()}`}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More ${label.toLowerCase()}`}>+</button>
      </div>
    </div>
  );
}

function Tier({ icon: Icon, name, metric, last, note }) {
  const tone = metric ? toneOf(metric.utilization) : 'signal';
  const capped = metric && metric.perReplicaQps !== Infinity;
  return (
    <div className={`dial-tier dial-tier--${tone}${last ? ' is-last' : ''}`}>
      <span className="dial-tier__icon"><Icon size={22} strokeWidth={1.75} /></span>
      <div className="dial-tier__body">
        <div className="dial-tier__head">
          <span className="dial-tier__name">{name}</span>
          {metric && metric.replicas > 1 && <span className="dial-tier__rep">×{metric.replicas}</span>}
          {capped && <span className={`dial-chip dial-chip--${tone}`}>{STATUS[tone]}</span>}
        </div>
        {capped ? (
          <>
            <div className="dial-tier__bar"><span style={{ transform: `scaleX(${Math.min(1, metric.utilization)})` }} /></div>
            <div className="dial-tier__meta">
              <span>{formatQps(metric.inQps)} req/s in</span>
              <span className="dial-tier__pct">{Math.round(metric.utilization * 100)}% of capacity</span>
            </div>
          </>
        ) : (
          <div className="dial-tier__meta"><span>{note || `${formatQps(metric.inQps)} req/s passing through`}</span><span>{metric ? 'no capacity limit' : 'traffic source'}</span></div>
        )}
      </div>
    </div>
  );
}

function Link({ qps, failing, label }) {
  // flow dots: faster with traffic, red when requests are failing
  const speed = Math.max(0.5, 2.6 - Math.log10(Math.max(qps, 10)) * 0.45);
  return (
    <div className={`dial-link${failing ? ' is-failing' : ''}`} style={{ '--flow': `${speed}s` }}>
      <span className="dial-link__wire"><i /><i /><i /></span>
      <span className="dial-link__label">{label}</span>
    </div>
  );
}

export default function LiveDial() {
  const [scenario, setScenario] = useState('cache');
  const [state, setState] = useState(SCENARIOS[0]);
  const set = (patch) => setState((s) => ({ ...s, ...patch }));
  const pick = (s) => {
    setScenario(s.id);
    setState(s);
  };
  const active = SCENARIOS.find((s) => s.id === scenario);

  const graph = useMemo(() => buildGraph(state), [state]);
  const a = useMemo(() => analyzeDesign(graph, { entryQps: state.traffic }), [graph, state.traffic]);
  const n = a.nodes;
  const tiers = ['lb', 'svc', 'cache', 'db'].map((id) => n[id]).filter(Boolean);
  const worst = tiers.reduce((w, r) => (r.utilization > (w?.utilization ?? -1) ? r : w), null);
  const served = a.successQps + a.failedQps > 0 ? (a.successQps / (a.successQps + a.failedQps)) * 100 : 100;
  const failing = a.errorRate > 0.05;
  const perServer = perReplicaQps('service', graph.nodes.find((x) => x.id === 'svc').data.config);
  const perDb = perReplicaQps('database', graph.nodes.find((x) => x.id === 'db').data.config);

  let verdict;
  let tone;
  if (worst && worst.utilization > 1) {
    tone = 'error';
    verdict = `${worst.label} is at ${Math.round(worst.utilization * 100)}% and dropping requests. It needs ${worst.neededReplicas} replicas, or less traffic reaching it.`;
  } else if (worst && worst.utilization > 0.8) {
    tone = 'warn';
    verdict = `${worst.label} is at ${Math.round(worst.utilization * 100)}%. One spike and it tips over; plan for ${worst.neededReplicas} replicas.`;
  } else {
    tone = 'signal';
    verdict = `Healthy. The busiest tier, ${worst?.label.toLowerCase()}, runs at ${Math.round((worst?.utilization ?? 0) * 100)}% with room for spikes.`;
  }
  const VerdictIcon = { signal: CheckCircle2, warn: AlertTriangle, error: OctagonX }[tone];

  return (
    <div className="dial" data-ui>
      <div className="dial__stage" aria-label="Request flow through the architecture">
        <Tier icon={Users} name="Users" metric={null} note={`${formatQps(state.traffic)} req/s sent`} />
        <Link qps={state.traffic} failing={false} label={`${formatQps(state.traffic)} req/s`} />
        <Tier icon={Split} name="Load balancer" metric={n.lb} />
        <Link qps={n.svc.inQps} failing={false} label="spread across servers" />
        <Tier icon={Server} name="App servers" metric={n.svc} />
        {n.cache && (
          <>
            <Link qps={n.cache.inQps} failing={n.svc.utilization > 1} label="every read checks the cache" />
            <Tier icon={Zap} name="Cache" metric={n.cache} />
          </>
        )}
        <Link
          qps={n.db.inQps}
          failing={failing}
          label={n.cache ? `${formatQps(n.db.inQps)} req/s miss the cache` : `${formatQps(n.db.inQps)} req/s, all of it`}
        />
        <Tier icon={Database} name="Database" metric={n.db} last />
      </div>

      <div className="dial__panel">
        <div className="dial__scenarios">
          <div className="dial-seg" role="tablist" aria-label="Scenarios">
            {SCENARIOS.map((s) => (
              <button key={s.id} role="tab" aria-selected={scenario === s.id} className={scenario === s.id ? 'is-active' : ''} onClick={() => pick(s)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="dial__note">{active.note}</p>
        </div>

        <label className="dial__slider">
          <span className="dial__slider-head">
            <span>Incoming traffic</span>
            <strong>{formatQps(state.traffic)} <small>req/s</small></strong>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={toSlider(state.traffic)}
            onChange={(e) => set({ traffic: toTraffic(Number(e.target.value)) })}
            aria-valuetext={`${state.traffic} requests per second`}
            style={{ '--fill': `${toSlider(state.traffic)}%` }}
          />
          <span className="dial__ticks" aria-hidden="true">
            {TICKS.map((t) => <span key={t} style={{ left: `${toSlider(t)}%` }}>{formatQps(t)}</span>)}
          </span>
        </label>

        <div className="dial__controls">
          <label className="dial-switch">
            <input type="checkbox" role="switch" checked={state.cache} onChange={(e) => set({ cache: e.target.checked })} />
            <span className="dial-switch__track" aria-hidden="true"><span /></span>
            <span>
              <span className="dial-stepper__label">Cache</span>
              <span className="dial-stepper__hint">85% hit rate</span>
            </span>
          </label>
          <Stepper label="App servers" hint={`${formatQps(perServer)} req/s each`} value={state.services} onChange={(v) => set({ services: v })} />
          <Stepper label="DB replicas" hint={`${formatQps(perDb)} req/s each`} value={state.dbs} onChange={(v) => set({ dbs: v })} max={20} />
        </div>

        <dl className="dial__readout">
          <div className={`is-${served >= 99 ? 'signal' : served >= 90 ? 'warn' : 'error'}`}>
            <dt>Requests served</dt><dd>{served.toFixed(1)}%</dd><dd className="dial__note-dd">target 99%</dd>
          </div>
          <div className={`is-${a.p99Ms <= P99_TARGET ? 'signal' : a.p99Ms <= P99_TARGET * 2 ? 'warn' : 'error'}`}>
            <dt>p99 latency</dt><dd>{Math.round(a.p99Ms)} ms</dd><dd className="dial__note-dd">target {P99_TARGET} ms</dd>
          </div>
          <div className={`is-${toneOf(n.db.utilization)}`}>
            <dt>Database load</dt><dd>{formatQps(n.db.inQps)}/s</dd><dd className="dial__note-dd">{Math.round(n.db.utilization * 100)}% of capacity</dd>
          </div>
        </dl>

        <p className={`dial__verdict dial__verdict--${tone}`} aria-live="polite">
          <VerdictIcon size={20} strokeWidth={2} aria-hidden="true" />
          <span>{verdict}</span>
        </p>
      </div>
    </div>
  );
}
