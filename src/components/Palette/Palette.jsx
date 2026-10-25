import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { CATEGORIES, NODE_TYPES } from '../../nodeDefs/nodeTypes';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useUiStore } from '../../store/useUiStore';
import ProblemsPanel from '../Problems/ProblemsPanel';

const NOTE_DEF = { label: 'Sticky note', glyph: 'txt', description: 'Free text on the canvas for assumptions and open questions.' };

function PaletteItem({ kind, def, onAdd }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/tracewire-kind', kind);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAdd(kind);
    }
  };
  return (
    <div
      className="palette-item"
      draggable
      onDragStart={onDragStart}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onAdd(kind)}
      tabIndex={0}
      role="button"
      aria-label={`Add ${def.label}`}
      title={`${def.description}\nDrag onto the canvas, or press Enter / double-click to add.`}
    >
      <span className="palette-item__glyph">{def.glyph}</span>
      <div className="palette-item__text">
        <div className="palette-item__label">{def.label}</div>
        <div className="palette-item__desc">{def.description}</div>
      </div>
    </div>
  );
}

function ComponentList({ onOpenBuilder }) {
  const customTypes = useDiagramStore((s) => s.customTypes);
  const addNode = useDiagramStore((s) => s.addNode);
  const setSelectedNode = useDiagramStore((s) => s.setSelectedNode);
  const { screenToFlowPosition } = useReactFlow();
  const [openCat, setOpenCat] = useState(() => new Set(CATEGORIES));
  const [query, setQuery] = useState('');

  const toggleCat = (cat) => {
    setOpenCat((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // keyboard / double-click add: drop the node in the middle of the visible canvas
  const addAtCenter = (kind) => {
    const pane = document.querySelector('.flow-canvas')?.getBoundingClientRect();
    const position = pane
      ? screenToFlowPosition({ x: pane.left + pane.width / 2 + Math.random() * 40, y: pane.top + pane.height / 2 + Math.random() * 40 })
      : { x: 0, y: 0 };
    const id = addNode(kind, position);
    if (kind !== 'note') setSelectedNode(id);
  };

  const q = query.trim().toLowerCase();
  const matches = (def) => !q || def.label.toLowerCase().includes(q) || def.description.toLowerCase().includes(q);
  const customEntries = Object.entries(customTypes).filter(([, def]) => matches(def));

  return (
    <>
      <div className="palette-search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${Object.keys(NODE_TYPES).length} components…`}
          aria-label="Search components"
        />
      </div>
      <div className="palette-scroll">
        {CATEGORIES.filter((c) => c !== 'Custom').map((cat) => {
          const entries = Object.entries(NODE_TYPES).filter(([, def]) => def.category === cat && matches(def));
          if (entries.length === 0) return null;
          const open = q || openCat.has(cat);
          return (
            <div className="palette-group" key={cat}>
              <button className="palette-group__header" onClick={() => toggleCat(cat)} aria-expanded={!!open}>
                <span>{cat} <span className="palette-group__count">{entries.length}</span></span>
                <span className="chevron">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className="palette-group__items">
                  {entries.map(([kind, def]) => (
                    <PaletteItem key={kind} kind={kind} def={def} onAdd={addAtCenter} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {matches(NOTE_DEF) && (
          <div className="palette-group">
            <div className="palette-group__header palette-group__header--static"><span>Annotate</span></div>
            <div className="palette-group__items">
              <PaletteItem kind="note" def={NOTE_DEF} onAdd={addAtCenter} />
            </div>
          </div>
        )}

        <div className="palette-group">
          <button className="palette-group__header" onClick={() => toggleCat('Custom')} aria-expanded={openCat.has('Custom')}>
            <span>Custom</span>
            <span className="chevron">{openCat.has('Custom') ? '−' : '+'}</span>
          </button>
          {openCat.has('Custom') && (
            <div className="palette-group__items">
              {customEntries.length === 0 && <div className="palette-empty">No custom components yet.</div>}
              {customEntries.map(([kind, def]) => (
                <PaletteItem key={kind} kind={kind} def={def} onAdd={addAtCenter} />
              ))}
              <button className="palette-add-btn" onClick={onOpenBuilder}>
                + New custom node
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Palette({ onOpenBuilder }) {
  const leftTab = useUiStore((s) => s.leftTab);
  const setLeftTab = useUiStore((s) => s.setLeftTab);
  const activeProblem = useUiStore((s) => s.activeProblemId);

  return (
    <aside className="palette">
      <div className="panel-tabs" role="tablist">
        <button role="tab" aria-selected={leftTab === 'components'} className={`panel-tab${leftTab === 'components' ? ' is-active' : ''}`} onClick={() => setLeftTab('components')}>
          Components
        </button>
        <button role="tab" aria-selected={leftTab === 'problems'} className={`panel-tab${leftTab === 'problems' ? ' is-active' : ''}`} onClick={() => setLeftTab('problems')}>
          Problems{activeProblem && <span className="panel-tab__dot" aria-label="problem selected" />}
        </button>
      </div>
      {leftTab === 'components' ? <ComponentList onOpenBuilder={onOpenBuilder} /> : <ProblemsPanel />}
    </aside>
  );
}
