import { useMemo, useState } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useUiStore } from '../../store/useUiStore';
import { analyzeDesign } from '../../simulation/analyze';
import { formatQps } from '../../utils/format';

const SECONDS_PER_DAY = 86400;

function NumberInput({ label, value, onChange, step = 1, unit }) {
  return (
    <label className="cap-input">
      <span className="dim">{label}</span>
      <span className="cap-input__box">
        <input type="number" min={0} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        {unit && <span className="dim">{unit}</span>}
      </span>
    </label>
  );
}

function initialEstimate(problem) {
  const r = problem?.requirements;
  return {
    dau: r?.dau ?? 1_000_000,
    perUser: r?.requestsPerUser ?? 10,
    writeShare: r ? Math.round((r.writeQps / (r.readQps + r.writeQps)) * 100) : 10,
    peak: 3,
    responseKb: 4,
    recordKb: 1,
    years: 5,
    replication: 3,
  };
}

function Estimator({ problem }) {
  const [e, setE] = useState(() => initialEstimate(problem));
  const set = (k) => (v) => setE({ ...e, [k]: v });

  const avgQps = (e.dau * e.perUser) / SECONDS_PER_DAY;
  const peakQps = avgQps * e.peak;
  const writeQps = (avgQps * e.writeShare) / 100;
  const readPeak = (peakQps * (100 - e.writeShare)) / 100;
  const storageGb = (writeQps * SECONDS_PER_DAY * 365 * e.years * e.recordKb * e.replication) / 1e6;
  const egressMBs = (readPeak * e.responseKb) / 1000;

  return (
    <div className="cap-section">
      <div className="eyebrow small">Back-of-envelope</div>
      <div className="cap-inputs">
        <NumberInput label="Daily active users" value={e.dau} onChange={set('dau')} step={100000} />
        <NumberInput label="Requests / user / day" value={e.perUser} onChange={set('perUser')} />
        <NumberInput label="Writes" value={e.writeShare} onChange={set('writeShare')} unit="%" />
        <NumberInput label="Peak factor" value={e.peak} onChange={set('peak')} step={0.5} unit="×" />
        <NumberInput label="Response size" value={e.responseKb} onChange={set('responseKb')} unit="KB" />
        <NumberInput label="Record size" value={e.recordKb} onChange={set('recordKb')} step={0.5} unit="KB" />
        <NumberInput label="Retention" value={e.years} onChange={set('years')} unit="yr" />
        <NumberInput label="Replication" value={e.replication} onChange={set('replication')} unit="×" />
      </div>
      <div className="cap-results">
        <div><span className="mono">{formatQps(avgQps)}</span><span className="dim">avg req/s</span></div>
        <div><span className="mono">{formatQps(peakQps)}</span><span className="dim">peak req/s</span></div>
        <div><span className="mono">{formatQps(writeQps)}</span><span className="dim">avg writes/s</span></div>
        <div><span className="mono">{storageGb >= 1000 ? `${(storageGb / 1000).toFixed(1)} TB` : `${storageGb.toFixed(0)} GB`}</span><span className="dim">storage</span></div>
        <div><span className="mono">{egressMBs >= 1000 ? `${(egressMBs / 1000).toFixed(1)} GB/s` : `${egressMBs.toFixed(0)} MB/s`}</span><span className="dim">peak egress</span></div>
      </div>
      <p className="dim small-print">avg = users × requests ÷ 86,400 · storage = writes × record × days × replication</p>
    </div>
  );
}

function LoadTable({ problem }) {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const updateManyConfigs = useDiagramStore((s) => s.updateManyConfigs);
  const problemQps = problem ? problem.requirements.readQps + problem.requirements.writeQps : null;
  const [testQps, setTestQps] = useState(problemQps ?? '');
  const entryQps = testQps === '' ? undefined : Number(testQps);

  const analysis = useMemo(() => analyzeDesign({ nodes, edges }, { entryQps }), [nodes, edges, entryQps]);
  const rows = Object.values(analysis.nodes).filter((m) => m.kind !== 'generator' && m.kind !== 'client');
  const resizable = rows.filter((m) => m.neededReplicas !== null);

  const rightSize = () => {
    const patches = {};
    for (const m of resizable) {
      const target = Math.max(m.neededReplicas, Math.min(m.replicas, 2)); // keep an existing failover replica
      if (target !== m.replicas) patches[m.id] = { replicas: target };
    }
    updateManyConfigs(patches);
  };

  return (
    <div className="cap-section">
      <div className="eyebrow small">Component load</div>
      <div className="cap-test">
        <NumberInput
          label={problemQps ? 'Test load (problem peak)' : 'Test load (blank = generator rates)'}
          value={testQps}
          onChange={(v) => setTestQps(Number.isFinite(v) && v > 0 ? v : '')}
          step={1000}
          unit="req/s"
        />
      </div>
      <div className="cap-summary mono">
        {formatQps(analysis.offeredQps)} in · {(analysis.errorRate * 100).toFixed(1)}% err · p99 ~{Math.round(analysis.p99Ms)} ms
      </div>
      {rows.length === 0 ? (
        <p className="dim">Add components to see their load.</p>
      ) : (
        <table className="cap-table">
          <thead>
            <tr><th>Component</th><th>In</th><th>Load</th><th>Rep.</th></tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const pct = Math.min(1, m.utilization);
              const color = m.utilization > 1 ? 'var(--accent-error)' : m.utilization > 0.8 ? 'var(--accent-warn)' : 'var(--accent-signal)';
              const short = m.neededReplicas !== null && m.neededReplicas > m.replicas;
              return (
                <tr key={m.id}>
                  <td title={m.perReplicaQps === Infinity ? 'not capacity-bound' : `${formatQps(m.perReplicaQps)} req/s per replica`}>{m.label}</td>
                  <td className="mono">{formatQps(m.inQps)}</td>
                  <td>
                    <div className="cap-bar"><div style={{ width: `${pct * 100}%`, background: color }} /></div>
                    <span className="mono cap-pct" style={{ color }}>{m.perReplicaQps === Infinity ? '—' : `${Math.round(m.utilization * 100)}%`}</span>
                  </td>
                  <td className="mono">
                    {m.replicas}
                    {short && <span className="cap-need" title="replicas needed for ~70% peak utilization"> →{m.neededReplicas}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {resizable.length > 0 && (
        <button className="tool-btn tool-btn--accent" onClick={rightSize} title="Set replicas so each component runs near 70% at this load">
          Right-size replicas
        </button>
      )}
    </div>
  );
}

export default function CapacityPanel() {
  const problem = useUiStore((s) => s.activeProblem());
  return (
    <div className="inspector-body">
      <Estimator key={problem?.id || 'free'} problem={problem} />
      <LoadTable key={`load-${problem?.id || 'free'}`} problem={problem} />
    </div>
  );
}
