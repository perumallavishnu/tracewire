import { useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDiagramStore } from '../../store/useDiagramStore';
import SchematicNode from './SchematicNode';
import NoteNode from './NoteNode';
import TraceEdge from './TraceEdge';

const nodeTypes = { schematic: SchematicNode, note: NoteNode };
const DELETE_KEYS = ['Delete', 'Backspace'];
const edgeTypes = { trace: TraceEdge };
const defaultEdgeOptions = { type: 'trace' };

export default function FlowCanvas() {
  const wrapperRef = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const onNodesChange = useDiagramStore((s) => s.onNodesChange);
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange);
  const onConnect = useDiagramStore((s) => s.onConnect);
  const addNode = useDiagramStore((s) => s.addNode);
  const setSelectedNode = useDiagramStore((s) => s.setSelectedNode);
  const setSelectedEdge = useDiagramStore((s) => s.setSelectedEdge);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData('application/tracewire-kind');
      if (!kind) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = addNode(kind, position);
      setSelectedNode(id);
    },
    [screenToFlowPosition, addNode, setSelectedNode]
  );

  // React Flow already handles Tab focus, Enter/Space select and arrow-key moves;
  // Escape additionally clears our own selection so the Inspector resets.
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    },
    [setSelectedNode, setSelectedEdge]
  );

  return (
    <div className="flow-canvas" ref={wrapperRef} onDragOver={onDragOver} onDrop={onDrop} onKeyDown={onKeyDown}>
      <ReactFlow
        deleteKeyCode={DELETE_KEYS}
        onNodesDelete={() => setSelectedNode(null)}
        onEdgesDelete={() => setSelectedEdge(null)}
        onSelectionChange={({ nodes: sel, edges: selEdges }) => {
          if (sel.length === 1) setSelectedNode(sel[0].id);
          else if (selEdges.length === 1 && sel.length === 0) setSelectedEdge(selEdges[0].id);
        }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--grid-dot)" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="tw-minimap" nodeColor={(n) => (n.type === 'note' ? 'var(--note)' : 'var(--trace)')} />
      </ReactFlow>
    </div>
  );
}
