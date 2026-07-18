import { useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Toolbar from './components/Toolbar/Toolbar';
import Palette from './components/Palette/Palette';
import FlowCanvas from './components/Canvas/FlowCanvas';
import Inspector from './components/Inspector/Inspector';
import MetricsDock from './components/Metrics/MetricsDock';
import ChaosDock from './components/ChaosPanel/ChaosDock';
import NodeBuilderModal from './components/NodeBuilder/NodeBuilderModal';
import { useDiagramStore } from './store/useDiagramStore';
import { useSimStore } from './store/useSimStore';
import './styles/app.css';

function useSimulationLoop() {
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  useEffect(() => {
    const loop = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = Math.min(0.25, (now - lastRef.current) / 1000);
      lastRef.current = now;
      const graph = { nodes: useDiagramStore.getState().nodes, edges: useDiagramStore.getState().edges };
      useSimStore.getState().step(dt, graph);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
}

export default function App() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const init = useDiagramStore((s) => s.init);
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const persist = useDiagramStore((s) => s.persist);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const t = setTimeout(() => persist(), 400);
    return () => clearTimeout(t);
  }, [nodes, edges, persist]);

  useSimulationLoop();

  return (
    <div className="app-shell">
      <Toolbar />
      <div className="app-body">
        <Palette onOpenBuilder={() => setBuilderOpen(true)} />
        <ReactFlowProvider>
          <div className="canvas-column">
            <FlowCanvas />
            <ChaosDock />
          </div>
        </ReactFlowProvider>
        <Inspector />
      </div>
      <MetricsDock />
      {builderOpen && <NodeBuilderModal onClose={() => setBuilderOpen(false)} />}
    </div>
  );
}
