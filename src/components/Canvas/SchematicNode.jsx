import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSimStore } from '../../store/useSimStore';
import { NODE_TYPES } from '../../nodeDefs/nodeTypes';
import { useDiagramStore } from '../../store/useDiagramStore';

function statusColor(status, hasEffects) {
  if (status === 'down') return 'var(--accent-error)';
  if (hasEffects) return 'var(--accent-warn)';
  return 'var(--border)';
}

function SchematicNodeInner({ id, data, selected }) {
  const runtime = useSimStore((s) => s.snapshot.nodes[id]);
  const util = runtime ? Math.min(1, runtime.utilization) : 0;
  const status = runtime?.status || 'up';
  const hasEffects = runtime?.effects?.length > 0;
  const barColor = util > 0.9 ? 'var(--accent-error)' : util > 0.6 ? 'var(--accent-warn)' : 'var(--accent-signal)';
  const customType = useDiagramStore((s) => s.customTypes[data.kind]);
  const glyph = NODE_TYPES[data.kind]?.glyph || customType?.glyph || '?';
  const replicas = data.config.replicas ?? 1;

  return (
    <div
      className={`schematic-node${selected ? ' is-selected' : ''}${status === 'down' ? ' is-down' : ''}`}
      style={{ borderColor: statusColor(status, hasEffects) }}
    >
      <Handle type="target" position={Position.Left} className="tw-handle" />
      <div className="schematic-node__head">
        <span className="schematic-node__glyph">{glyph}</span>
        <span className="schematic-node__label">{data.label}</span>
        {replicas > 1 && <span className="schematic-node__replicas mono" title={`${replicas} replicas`}>×{replicas}</span>}
      </div>
      <div className="schematic-node__stats">
        {runtime && data.kind !== 'client' && data.kind !== 'generator' && (
          <>
            {'inFlight' in runtime && (data.config.capacity !== undefined) && (
              <span className="mono">{runtime.inFlight}/{Math.round((data.config.capacity || 0) * (data.kind === 'ratelimiter' ? 1 : replicas))}</span>
            )}
            {data.config.queueCapacity !== undefined && (
              <span className="mono">q:{runtime.queueDepth}</span>
            )}
            {data.config.cacheHitRate !== undefined && runtime.cacheHits + runtime.cacheMisses > 0 && (
              <span className="mono">
                hit:{Math.round((runtime.cacheHits / Math.max(1, runtime.cacheHits + runtime.cacheMisses)) * 100)}%
              </span>
            )}
          </>
        )}
        {data.kind === 'generator' && <span className="mono">{data.config.rate}/s</span>}
      </div>
      <div className="schematic-node__bar-track">
        <div className="schematic-node__bar-fill" style={{ width: `${util * 100}%`, background: barColor }} />
      </div>
      {status === 'down' && <div className="schematic-node__down-badge">DOWN</div>}
      <Handle type="source" position={Position.Right} className="tw-handle" />
    </div>
  );
}

export default memo(SchematicNodeInner);
