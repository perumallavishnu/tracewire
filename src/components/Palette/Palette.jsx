import { useState } from 'react';
import { CATEGORIES, NODE_TYPES } from '../../nodeDefs/nodeTypes';
import { useDiagramStore } from '../../store/useDiagramStore';

function PaletteItem({ kind, def }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/tracewire-kind', kind);
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div className="palette-item" draggable onDragStart={onDragStart} title={def.description}>
      <span className="palette-item__glyph">{def.glyph}</span>
      <div className="palette-item__text">
        <div className="palette-item__label">{def.label}</div>
        <div className="palette-item__desc">{def.description}</div>
      </div>
    </div>
  );
}

export default function Palette({ onOpenBuilder }) {
  const customTypes = useDiagramStore((s) => s.customTypes);
  const [openCat, setOpenCat] = useState(() => new Set(CATEGORIES));

  const toggleCat = (cat) => {
    setOpenCat((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const customEntries = Object.entries(customTypes);

  return (
    <aside className="palette">
      <div className="panel-heading">
        <span className="eyebrow">Components</span>
      </div>
      <div className="palette-scroll">
        {CATEGORIES.filter((c) => c !== 'Custom').map((cat) => (
          <div className="palette-group" key={cat}>
            <button className="palette-group__header" onClick={() => toggleCat(cat)}>
              <span>{cat}</span>
              <span className="chevron">{openCat.has(cat) ? '−' : '+'}</span>
            </button>
            {openCat.has(cat) && (
              <div className="palette-group__items">
                {Object.entries(NODE_TYPES)
                  .filter(([, def]) => def.category === cat)
                  .map(([kind, def]) => (
                    <PaletteItem key={kind} kind={kind} def={def} />
                  ))}
              </div>
            )}
          </div>
        ))}

        <div className="palette-group">
          <button className="palette-group__header" onClick={() => toggleCat('Custom')}>
            <span>Custom</span>
            <span className="chevron">{openCat.has('Custom') ? '−' : '+'}</span>
          </button>
          {openCat.has('Custom') && (
            <div className="palette-group__items">
              {customEntries.length === 0 && <div className="palette-empty">No custom components yet.</div>}
              {customEntries.map(([kind, def]) => (
                <PaletteItem key={kind} kind={kind} def={def} />
              ))}
              <button className="palette-add-btn" onClick={onOpenBuilder}>
                + New custom node
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
