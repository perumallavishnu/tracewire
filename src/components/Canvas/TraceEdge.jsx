import { memo, useMemo } from 'react';
import { EdgeLabelRenderer } from '@xyflow/react';
import { useSimStore } from '../../store/useSimStore';
import { buildStepPath } from '../../utils/edgePath';

function pulseColor(status) {
  if (status === 'retry') return 'var(--accent-warn)';
  return 'var(--accent-signal)';
}

function TraceEdgeInner({ id, sourceX, sourceY, targetX, targetY, selected }) {
  const runtime = useSimStore((s) => s.snapshot.edges[id]);
  const { d, pointAtProgress, labelX, labelY } = useMemo(
    () => buildStepPath(sourceX, sourceY, targetX, targetY),
    [sourceX, sourceY, targetX, targetY]
  );
  const partitioned = runtime?.partitioned;
  const pulses = runtime?.pulses || [];

  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={partitioned ? 'var(--accent-error)' : selected ? 'var(--accent-info)' : 'var(--trace)'}
        strokeWidth={selected ? 2.5 : 1.5}
        strokeDasharray={partitioned ? '4 4' : undefined}
        className="trace-edge-path"
      />
      {!partitioned &&
        pulses.map((p) => {
          const pt = pointAtProgress(p.progress);
          return (
            <circle
              key={p.id}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill={pulseColor(p.status)}
              className="trace-pulse"
            />
          );
        })}
      {partitioned && (
        <EdgeLabelRenderer>
          <div
            className="trace-edge-partition-label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            ✕ severed
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(TraceEdgeInner);
