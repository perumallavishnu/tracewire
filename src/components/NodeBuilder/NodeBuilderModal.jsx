import { useState } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';

const BEHAVIOR_TOGGLES = [
  { key: 'capacity', label: 'Capacity-limited', hint: 'Rejects/queues once concurrent load exceeds capacity', fields: ['capacity'] },
  { key: 'latency', label: 'Processing latency', hint: 'Adds base + jitter latency to every request', fields: ['baseLatencyMs', 'jitterMs'] },
  { key: 'failure', label: 'Random failures', hint: 'Fails a fraction of requests independent of load', fields: ['failureRate'] },
  { key: 'queue', label: 'Buffers in a queue', hint: 'Holds excess requests instead of rejecting immediately', fields: ['queueCapacity'] },
  { key: 'cache', label: 'Cache-like hit rate', hint: 'Short-circuits a fraction of requests with low latency', fields: ['cacheHitRate', 'missPenaltyMs'] },
];

const DEFAULTS = {
  capacity: 150,
  baseLatencyMs: 20,
  jitterMs: 10,
  failureRate: 0.01,
  queueCapacity: 50,
  cacheHitRate: 0.6,
  missPenaltyMs: 15,
};

export default function NodeBuilderModal({ onClose }) {
  const registerCustomType = useDiagramStore((s) => s.registerCustomType);
  const [label, setLabel] = useState('Custom Component');
  const [glyph, setGlyph] = useState('cus');
  const [enabled, setEnabled] = useState(new Set(['capacity', 'latency', 'failure']));

  const toggle = (key) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleCreate = () => {
    const fields = [];
    const defaultConfig = {};
    for (const b of BEHAVIOR_TOGGLES) {
      if (enabled.has(b.key)) {
        for (const f of b.fields) {
          fields.push(f);
          defaultConfig[f] = DEFAULTS[f];
        }
      }
    }
    const id = `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`;
    registerCustomType(id, {
      label,
      glyph: glyph.slice(0, 4) || 'cus',
      category: 'Custom',
      description: `Custom component (${[...enabled].join(', ') || 'passthrough'})`,
      defaultConfig,
      fields,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="eyebrow">New custom component</span>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <label className="field">
            <span className="field__label">Name</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Search Index" />
          </label>
          <label className="field">
            <span className="field__label">Badge (max 4 chars)</span>
            <input value={glyph} onChange={(e) => setGlyph(e.target.value)} maxLength={4} placeholder="idx" />
          </label>

          <div className="eyebrow small" style={{ marginTop: 14 }}>Behavior</div>
          <div className="builder-toggles">
            {BEHAVIOR_TOGGLES.map((b) => (
              <label key={b.key} className="builder-toggle">
                <input type="checkbox" checked={enabled.has(b.key)} onChange={() => toggle(b.key)} />
                <div>
                  <div className="builder-toggle__label">{b.label}</div>
                  <div className="builder-toggle__hint">{b.hint}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="modal__footer">
          <button className="tool-btn" onClick={onClose}>Cancel</button>
          <button className="tool-btn tool-btn--accent" onClick={handleCreate} disabled={!label.trim()}>
            Create component
          </button>
        </div>
      </div>
    </div>
  );
}
