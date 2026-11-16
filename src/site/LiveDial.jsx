import { useMemo, useState } from 'react';
import { analyzeDesign } from '../simulation/analyze';
import { buildDemoGraph as buildGraph } from './demoModel';
import { formatQps } from '../utils/format';

// The landing page's live thing: a five-box architecture run through the same
// steady-state model the simulator scores with. Every number on screen is computed.

const SCENARIOS = [
  { id: 'cache', label: 'With a cache', traffic: 20000, cache: true, services: 5, dbs: 2 },
  { id: 'nocache', label: 'No cache', traffic: 20000, cache: false, services: 5, dbs: 2 },
  { id: 'spike', label: 'Launch spike', traffic: 80000, cache: true, services: 5, dbs: 2 },
];

// log scale: slider 0..100 -> 500..200,000 req/s
const MIN = 500;
const MAX = 200000;
const toTraffic = (v) => Math.round(MIN * Math.pow(MAX / MIN, v / 100) / 100) * 100;
const toSlider = (t) => (Math.log(t / MIN) / Math.log(MAX / MIN)) * 100;

function Stepper({ label, value, onChange, min = 1, max = 40 }) {
  return (
    <div className="dial-stepper">
      <span>{label}</span>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}>−</button>
      <output>{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More ${label}`}>+</button>
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

  const graph = useMemo(() => buildGraph(state), [state]);
  const a = useMemo(() => analyzeDesign(graph, { entryQps: state.traffic }), [graph, state.traffic]);
  const rows = ['lb', 'svc', 'cache', 'db'].map((id) => a.nodes[id]).filter(Boolean);
  const worst = rows.reduce((w, r) => (r.utilization > (w?.utilization ?? -1) ? r : w), null);
  const okPct = a.offeredQps > 0 ? (a.successQps / (a.successQps + a.failedQps)) * 100 : 100;

  let verdict;
  if (worst && worst.utilization > 1) {
    verdict = `${worst.label} is at ${Math.round(worst.utilization * 100)}% and dropping requests. It needs ${worst.neededReplicas} replicas, or less traffic reaching it.`;
  } else if (worst && worst.utilization > 0.8) {
    verdict = `${worst.label} is at ${Math.round(worst.utilization * 100)}%. One spike and it tips over; plan for ${worst.neededReplicas} replicas.`;
  } else {
    verdict = `Every component is under 80%. The hottest, ${worst?.label.toLowerCase()}, runs at ${Math.round((worst?.utilization ?? 0) * 100)}%.`;
  }

  return (
    <div className="dial" data-ui>
      <div className="dial__tabs" role="tablist" aria-label="Scenarios">
        {SCENARIOS.map((s) => (
          <button key={s.id} role="tab" aria-selected={scenario === s.id} className={scenario === s.id ? 'is-active' : ''} onClick={() => pick(s)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="dial__board">
        {rows.map((r) => {
          const util = Math.min(1, r.utilization);
          const tone = r.utilization > 1 ? 'error' : r.utilization > 0.8 ? 'warn' : 'signal';
          return (
            <div key={r.id} className={`dial-node dial-node--${tone}`}>
              <div className="dial-node__head">
                <span className="dial-node__name">{r.label}</span>
                {r.replicas > 1 && <span className="dial-node__rep">×{r.replicas}</span>}
              </div>
              <div className="dial-node__bar"><span style={{ transform: `scaleX(${util})` }} /></div>
              <div className="dial-node__meta">
                <span>{formatQps(r.inQps)} req/s in</span>
                <span>{r.perReplicaQps === Infinity ? 'no limit' : `${Math.round(r.utilization * 100)}%`}</span>
              </div>
            </div>
          );
        })}
      </div>

      <label className="dial__slider">
        <span>Traffic <strong>{formatQps(state.traffic)} req/s</strong></span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={toSlider(state.traffic)}
          onChange={(e) => set({ traffic: toTraffic(Number(e.target.value)) })}
          aria-valuetext={`${state.traffic} requests per second`}
        />
      </label>

      <div className="dial__controls">
        <label className="dial-toggle">
          <input type="checkbox" checked={state.cache} onChange={(e) => set({ cache: e.target.checked })} />
          <span>Cache, 85% hit rate</span>
        </label>
        <Stepper label="App servers" value={state.services} onChange={(v) => set({ services: v })} />
        <Stepper label="DB replicas" value={state.dbs} onChange={(v) => set({ dbs: v })} max={20} />
      </div>

      <dl className="dial__readout">
        <div><dt>Served</dt><dd>{okPct.toFixed(1)}%</dd></div>
        <div><dt>p99 latency</dt><dd>{Math.round(a.p99Ms)} ms</dd></div>
        <div><dt>Database load</dt><dd>{formatQps(a.nodes.db.inQps)}/s</dd></div>
      </dl>
      <p className="dial__verdict" aria-live="polite">{verdict}</p>
    </div>
  );
}
