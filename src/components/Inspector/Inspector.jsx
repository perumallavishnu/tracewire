import { useDiagramStore } from '../../store/useDiagramStore';
import { useSimStore } from '../../store/useSimStore';
import { fieldsForKind, fieldDef } from '../../nodeDefs/fieldSchemas';

function Field({ fieldKey, value, onChange }) {
  const def = fieldDef(fieldKey);
  if (!def) return null;
  if (def.type === 'select') {
    return (
      <label className="field">
        <span className="field__label">{def.label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {def.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    );
  }
  const displayValue = def.type === 'percent' ? Math.round(value * 100) : value;
  return (
    <label className="field">
      <span className="field__label">
        {def.label} <span className="field__value mono">{displayValue}{def.type === 'percent' ? '%' : def.unit ? ` ${def.unit}` : ''}</span>
      </span>
      <input
        type="range"
        min={def.type === 'percent' ? def.min * 100 : def.min}
        max={def.type === 'percent' ? def.max * 100 : def.max}
        step={def.type === 'percent' ? def.step * 100 : def.step}
        value={displayValue}
        onChange={(e) => {
          const raw = Number(e.target.value);
          onChange(def.type === 'percent' ? raw / 100 : raw);
        }}
      />
    </label>
  );
}

export default function Inspector() {
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDiagramStore((s) => s.selectedEdgeId);
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const customTypes = useDiagramStore((s) => s.customTypes);
  const updateNodeConfig = useDiagramStore((s) => s.updateNodeConfig);
  const updateEdgeConfig = useDiagramStore((s) => s.updateEdgeConfig);
  const renameNode = useDiagramStore((s) => s.renameNode);
  const deleteNode = useDiagramStore((s) => s.deleteNode);
  const deleteEdge = useDiagramStore((s) => s.deleteEdge);
  const runtimeNodes = useSimStore((s) => s.snapshot.nodes);
  const runtimeEdges = useSimStore((s) => s.snapshot.edges);
  const killNode = useSimStore((s) => s.killNode);
  const reviveNode = useSimStore((s) => s.reviveNode);
  const latencySpike = useSimStore((s) => s.latencySpike);
  const capacityDrop = useSimStore((s) => s.capacityDrop);
  const partitionEdge = useSimStore((s) => s.partitionEdge);
  const healEdge = useSimStore((s) => s.healEdge);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const edge = edges.find((e) => e.id === selectedEdgeId);

  if (!node && !edge) {
    return (
      <aside className="inspector">
        <div className="panel-heading"><span className="eyebrow">Inspector</span></div>
        <div className="inspector-empty">
          Select a component or connection on the canvas to view and edit its behavior.
        </div>
      </aside>
    );
  }

  if (edge) {
    const edgeRuntime = runtimeEdges[edge.id];
    const partitioned = edgeRuntime?.partitioned;
    return (
      <aside className="inspector">
        <div className="panel-heading"><span className="eyebrow">Connection</span></div>
        <div className="inspector-body">
          <div className="inspector-title mono">{edge.id}</div>
          <label className="field">
            <span className="field__label">
              Network latency <span className="field__value mono">{edge.data?.latencyMs ?? 5} ms</span>
            </span>
            <input
              type="range" min={0} max={500} step={1}
              value={edge.data?.latencyMs ?? 5}
              onChange={(e) => updateEdgeConfig(edge.id, { latencyMs: Number(e.target.value) })}
            />
          </label>
          <div className="inspector-chaos">
            <div className="eyebrow small">Chaos</div>
            <div className="inspector-chaos__row">
              {!partitioned ? (
                <button className="chaos-btn" onClick={() => partitionEdge(edge.id)}>Sever connection</button>
              ) : (
                <button className="chaos-btn is-active" onClick={() => healEdge(edge.id)}>Heal connection</button>
              )}
            </div>
          </div>
          <button className="danger-btn" onClick={() => deleteEdge(edge.id)}>Delete connection</button>
        </div>
      </aside>
    );
  }

  const runtime = runtimeNodes[node.id];
  const fields = fieldsForKind(node.data.kind, customTypes);
  const isDown = runtime?.status === 'down';

  return (
    <aside className="inspector">
      <div className="panel-heading"><span className="eyebrow">Inspector</span></div>
      <div className="inspector-body">
        <input
          className="inspector-title-input"
          value={node.data.label}
          onChange={(e) => renameNode(node.id, e.target.value)}
        />
        <div className="inspector-kind mono">{node.data.kind}</div>

        {runtime && (
          <div className="inspector-runtime">
            <div><span className="mono">{Math.round(runtime.utilization * 100)}%</span><span className="dim"> utilization</span></div>
            <div><span className="mono">{runtime.completed}</span><span className="dim"> completed</span></div>
            <div><span className="mono">{runtime.failed}</span><span className="dim"> failed</span></div>
          </div>
        )}

        {fields.map((key) => (
          <Field
            key={key}
            fieldKey={key}
            value={node.data.config[key]}
            onChange={(v) => updateNodeConfig(node.id, { [key]: v })}
          />
        ))}

        {node.data.kind !== 'generator' && node.data.kind !== 'client' && (
          <div className="inspector-chaos">
            <div className="eyebrow small">Chaos</div>
            <div className="inspector-chaos__row">
              {!isDown ? (
                <button className="chaos-btn" onClick={() => killNode(node.id)}>Kill node</button>
              ) : (
                <button className="chaos-btn is-active" onClick={() => reviveNode(node.id)}>Revive node</button>
              )}
              <button className="chaos-btn" onClick={() => latencySpike(node.id, 6, 8)}>Latency spike</button>
              <button className="chaos-btn" onClick={() => capacityDrop(node.id, 0.25, 8)}>Drop capacity</button>
            </div>
          </div>
        )}

        <button className="danger-btn" onClick={() => deleteNode(node.id)}>Delete component</button>
      </div>
    </aside>
  );
}
