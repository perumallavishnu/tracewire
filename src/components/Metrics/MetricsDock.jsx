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

// Charts carry real axes: simulated seconds along the bottom, the metric with its unit up the side.
// floor keeps an idle chart from collapsing to a flat 0–0 range.
const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' };

function formatTick(value, unit) {
  if (unit === '%') return `${Math.round(value)}%`;
  const v = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`;
  return `${v}${unit}`;
}

function MiniChart({ data, dataKey, color, unit, label, floor }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--grid-line)" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v) => `${Math.round(v)}s`}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          minTickGap={28}
          allowDataOverflow
        />
        <YAxis
          width={46}
          domain={[0, (max) => Math.max(floor, Math.ceil(max * 1.15))]}
          tickFormatter={(v) => formatTick(v, unit)}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickCount={4}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', fontSize: 11 }}
          labelFormatter={(t) => `t = ${Number(t).toFixed(1)} s`}
          formatter={(v) => [`${Math.round(v * 10) / 10} ${unit.trim()}`, label]}
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
          <div className="chart-block__title">Throughput <span>req/s over sim time</span></div>
          <div className="chart-block__plot"><MiniChart data={history} dataKey="throughput" color="var(--accent-signal)" unit="" label="throughput (req/s)" floor={10} /></div>
        </div>
        <div className="chart-block">
          <div className="chart-block__title">Error rate <span>% of requests failed</span></div>
          <div className="chart-block__plot"><MiniChart data={history} dataKey="errorRate" color="var(--accent-error)" unit="%" label="error rate" floor={5} /></div>
        </div>
        <div className="chart-block">
          <div className="chart-block__title">p95 latency <span>milliseconds</span></div>
          <div className="chart-block__plot"><MiniChart data={history} dataKey="p95" color="var(--accent-warn)" unit="ms" label="p95 latency" floor={50} /></div>
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
