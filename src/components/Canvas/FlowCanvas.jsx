import { useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDiagramStore } from '../../store/useDiagramStore';
import SchematicNode from './SchematicNode';
import TraceEdge from './TraceEdge';

const nodeTypes = { schematic: SchematicNode };
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

  return (
    <div className="flow-canvas" ref={wrapperRef} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
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
        <MiniMap pannable zoomable className="tw-minimap" />
      </ReactFlow>
    </div>
  );
}
