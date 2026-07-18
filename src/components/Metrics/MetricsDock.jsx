import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSimStore } from '../../store/useSimStore';

function Stat({ label, value, accent }) {
  return (
    <div className="stat">
      <div className="stat__value mono" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

function MiniChart({ data, dataKey, color, unit }) {
  return (
    <ResponsiveContainer width="100%" height={70}>
      <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--grid-line)" vertical={false} />
        <XAxis dataKey="t" hide />
        <YAxis hide domain={[0, 'auto']} />
        <Tooltip
          contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', fontSize: 11 }}
          labelFormatter={() => ''}
          formatter={(v) => [`${Math.round(v * 10) / 10}${unit}`, dataKey]}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function MetricsDock() {
  const snapshot = useSimStore((s) => s.snapshot);
  const { metrics, history, eventLog } = snapshot;

  return (
    <div className="metrics-dock">
      <div className="metrics-dock__stats">
        <Stat label="throughput req/s" value={(metrics.throughput || 0).toFixed(1)} accent="var(--accent-signal)" />
        <Stat label="error rate" value={`${(metrics.errorRate || 0).toFixed(1)}%`} accent="var(--accent-error)" />
        <Stat label="p50 latency" value={`${Math.round(metrics.p50 || 0)}ms`} />
        <Stat label="p95 latency" value={`${Math.round(metrics.p95 || 0)}ms`} accent="var(--accent-warn)" />
        <Stat label="p99 latency" value={`${Math.round(metrics.p99 || 0)}ms`} accent="var(--accent-error)" />
      </div>
      <div className="metrics-dock__charts">
        <div className="chart-block">
          <div className="chart-block__title">Throughput</div>
          <MiniChart data={history} dataKey="throughput" color="var(--accent-signal)" unit=" rps" />
        </div>
        <div className="chart-block">
          <div className="chart-block__title">Error rate</div>
          <MiniChart data={history} dataKey="errorRate" color="var(--accent-error)" unit="%" />
        </div>
        <div className="chart-block">
          <div className="chart-block__title">p95 latency</div>
          <MiniChart data={history} dataKey="p95" color="var(--accent-warn)" unit="ms" />
        </div>
      </div>
      <div className="metrics-dock__log">
        <div className="chart-block__title">Event feed</div>
        <div className="event-log">
          {eventLog.length === 0 && <div className="dim">Run the simulation to see events here.</div>}
          {[...eventLog].reverse().map((e) => (
            <div key={e.id} className={`event-log__row event-log__row--${e.level}`}>
              <span className="mono event-log__t">{e.t.toFixed(1)}s</span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
