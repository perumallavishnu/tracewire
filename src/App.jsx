import { useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Toolbar from './components/Toolbar/Toolbar';
import Palette from './components/Palette/Palette';
import FlowCanvas from './components/Canvas/FlowCanvas';
import RightPanel from './components/RightPanel/RightPanel';
import InterviewBar from './components/Interview/InterviewBar';
import LearnDrawer from './components/Learn/LearnDrawer';
import MetricsDock from './components/Metrics/MetricsDock';
import ChaosDock from './components/ChaosPanel/ChaosDock';
import NodeBuilderModal from './components/NodeBuilder/NodeBuilderModal';
import { useDiagramStore } from './store/useDiagramStore';
import { useSimStore } from './store/useSimStore';
import { useUiStore } from './store/useUiStore';
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

// Space toggles the simulation and S scores, unless the user is typing.
function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.target.closest?.('button, [role="button"], .react-flow__node')) return; // keep Space/Enter for focused controls
      if (e.code === 'Space') {
        e.preventDefault();
        useSimStore.getState().toggle();
      } else if (e.key === 's' || e.key === 'S') {
        useUiStore.getState().runScore();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
  useGlobalShortcuts();

  return (
    <div className="app-shell">
      <Toolbar />
      <InterviewBar />
      <ReactFlowProvider>
        <div className="app-body">
          <Palette onOpenBuilder={() => setBuilderOpen(true)} />
          <div className="canvas-column">
            <FlowCanvas />
            <ChaosDock />
          </div>
          <RightPanel />
        </div>
      </ReactFlowProvider>
      <MetricsDock />
      {builderOpen && <NodeBuilderModal onClose={() => setBuilderOpen(false)} />}
      <LearnDrawer />
    </div>
  );
}
