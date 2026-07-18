import { useSimStore } from '../../store/useSimStore';

export default function ChaosDock() {
  const snapshot = useSimStore((s) => s.snapshot);
  const setChaosMonkey = useSimStore((s) => s.setChaosMonkey);
  const engine = useSimStore((s) => s.engine);
  const monkeyEnabled = engine.chaos.monkeyEnabled;

  return (
    <div className="chaos-dock">
      <button
        className={`monkey-btn${monkeyEnabled ? ' is-active' : ''}`}
        onClick={() => setChaosMonkey(!monkeyEnabled, 4000)}
        title="Randomly kills nodes, spikes latency, or drops capacity while running"
      >
        <span className="monkey-btn__icon">⚡</span>
        Chaos monkey {monkeyEnabled ? 'on' : 'off'}
      </button>
      <div className="chaos-dock__effects">
        {snapshot.activeEffects.length === 0 ? (
          <span className="dim">No active incidents</span>
        ) : (
          snapshot.activeEffects.map((e, i) => (
            <span key={i} className={`effect-chip effect-chip--${e.type}`}>
              {e.type} · {e.targetId}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
