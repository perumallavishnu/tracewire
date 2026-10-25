import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import { useDiagramStore } from '../../store/useDiagramStore';

// Free-text sticky note. Not part of the simulation: it has no handles, so it
// can't be wired in, and the engine/scorer skip kind === 'note'.
function NoteNodeInner({ id, data, selected }) {
  const setNoteText = useDiagramStore((s) => s.setNoteText);
  return (
    <div className={`note-node${selected ? ' is-selected' : ''}`}>
      <NodeResizer isVisible={selected} minWidth={140} minHeight={70} lineClassName="note-node__resize" />
      <div className="note-node__grip">note</div>
      <textarea
        className="note-node__text nodrag"
        value={data.text}
        placeholder="Assumptions, trade-offs, open questions…"
        aria-label="Note text"
        onChange={(e) => setNoteText(id, e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default memo(NoteNodeInner);
