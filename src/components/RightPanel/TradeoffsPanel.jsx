import { useState } from 'react';
import { NODE_TYPES } from '../../nodeDefs/nodeTypes';
import { TRADEOFFS } from '../../nodeDefs/tradeoffs';
import { useDiagramStore } from '../../store/useDiagramStore';

export default function TradeoffsPanel() {
  const selectedKind = useDiagramStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId)?.data.kind);
  const [browseKind, setBrowseKind] = useState('cache');
  const kind = selectedKind && TRADEOFFS[selectedKind] ? selectedKind : browseKind;
  const t = TRADEOFFS[kind];
  const def = NODE_TYPES[kind];

  return (
    <div className="inspector-body">
      {!(selectedKind && TRADEOFFS[selectedKind]) && (
        <label className="field">
          <span className="field__label">Select a component on the canvas, or browse</span>
          <select value={browseKind} onChange={(e) => setBrowseKind(e.target.value)}>
            {Object.entries(NODE_TYPES).map(([k, d]) => (
              <option key={k} value={k}>{d.label}</option>
            ))}
          </select>
        </label>
      )}
      <div className="tradeoff-head">
        <span className="palette-item__glyph">{def.glyph}</span>
        <span className="tradeoff-head__label">{def.label}</span>
      </div>
      <p className="tradeoff-use">{t.use}</p>
      <div className="tradeoff-cols">
        <div>
          <div className="eyebrow small tradeoff-pro">Gains</div>
          <ul>{t.pros.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
        <div>
          <div className="eyebrow small tradeoff-con">Costs</div>
          <ul>{t.cons.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      </div>
      {t.alt && (
        <div className="tradeoff-alt">
          <span className="eyebrow small">Consider instead</span>
          <p>{t.alt}</p>
        </div>
      )}
    </div>
  );
}
