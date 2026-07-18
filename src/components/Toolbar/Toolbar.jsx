import { useRef } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { useDiagramStore } from '../../store/useDiagramStore';

const SPEEDS = [0.5, 1, 2, 4];

export default function Toolbar() {
  const running = useSimStore((s) => s.running);
  const speed = useSimStore((s) => s.speed);
  const toggle = useSimStore((s) => s.toggle);
  const setSpeed = useSimStore((s) => s.setSpeed);
  const resetSim = useSimStore((s) => s.resetSim);
  const fileInputRef = useRef(null);

  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const customTypes = useDiagramStore((s) => s.customTypes);
  const loadDiagram = useDiagramStore((s) => s.loadDiagram);
  const resetToSeed = useDiagramStore((s) => s.resetToSeed);
  const clearCanvas = useDiagramStore((s) => s.clearCanvas);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges, customTypes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tracewire-diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        loadDiagram(parsed);
        resetSim();
      } catch (err) {
        alert('Could not read that file — is it a Tracewire diagram export?');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo">◈</span>
        <span className="toolbar__title">Tracewire</span>
        <span className="toolbar__subtitle">system design simulator</span>
      </div>

      <div className="toolbar__controls">
        <button className={`play-btn${running ? ' is-running' : ''}`} onClick={toggle}>
          {running ? '❚❚ Pause' : '▶ Run'}
        </button>
        <div className="speed-group">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`speed-btn${speed === s ? ' is-active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
        <button className="tool-btn" onClick={resetSim} title="Reset simulation metrics & runtime state">
          Reset sim
        </button>
      </div>

      <div className="toolbar__file-ops">
        <button className="tool-btn" onClick={() => { if (confirm('Clear the canvas?')) { clearCanvas(); resetSim(); } }}>
          New
        </button>
        <button className="tool-btn" onClick={() => { resetToSeed(); resetSim(); }}>
          Load example
        </button>
        <button className="tool-btn" onClick={handleImportClick}>Import</button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
        <button className="tool-btn tool-btn--accent" onClick={handleExport}>Export</button>
      </div>
    </header>
  );
}
