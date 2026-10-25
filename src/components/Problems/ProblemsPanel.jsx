import { useState } from 'react';
import { PROBLEMS } from '../../problems/problems';
import { sampleToDiagram } from '../../problems/sample';
import { useUiStore } from '../../store/useUiStore';
import { useDiagramStore } from '../../store/useDiagramStore';
import { useSimStore } from '../../store/useSimStore';
import { formatQps, formatGb } from '../../utils/format';

function ProblemBrief({ problem }) {
  const [hintsShown, setHintsShown] = useState(0);
  const runScore = useUiStore((s) => s.runScore);
  const setActiveProblem = useUiStore((s) => s.setActiveProblem);
  const loadDiagram = useDiagramStore((s) => s.loadDiagram);
  const customTypes = useDiagramStore((s) => s.customTypes);
  const resetSim = useSimStore((s) => s.resetSim);
  const r = problem.requirements;

  const loadSample = () => {
    if (!confirm('Replace the canvas with the reference design? Export first if you want to keep yours.')) return;
    loadDiagram({ ...sampleToDiagram(problem), customTypes });
    resetSim();
  };

  return (
    <div className="problem-brief">
      <button className="link-btn" onClick={() => setActiveProblem(null)}>← All problems</button>
      <div className="problem-brief__title">
        <h2>{problem.title}</h2>
        <span className={`difficulty difficulty--${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
      </div>
      <p className="problem-brief__summary">{problem.summary}</p>

      <div className="req-grid">
        <div><span className="mono">{formatQps(r.readQps)}</span><span className="dim">reads/s</span></div>
        <div><span className="mono">{formatQps(r.writeQps)}</span><span className="dim">writes/s</span></div>
        <div><span className="mono">{r.p99Ms} ms</span><span className="dim">p99 target</span></div>
        <div><span className="mono">{formatGb(r.storageGb)}</span><span className="dim">storage</span></div>
        <div><span className="mono">{formatQps(r.dau)}</span><span className="dim">daily users</span></div>
      </div>

      <div className="eyebrow small">Constraints</div>
      <ul className="problem-brief__list">
        {problem.constraints.map((c) => <li key={c}>{c}</li>)}
      </ul>

      <div className="eyebrow small">Hints</div>
      <div className="hint-list">
        {problem.hints.slice(0, hintsShown).map((h, i) => (
          <div key={h.title} className="hint">
            <div className="hint__title">{i + 1}. {h.title}</div>
            <div className="hint__body">{h.body}</div>
          </div>
        ))}
        {hintsShown < problem.hints.length && (
          <button className="tool-btn" onClick={() => setHintsShown(hintsShown + 1)}>
            Reveal hint {hintsShown + 1} of {problem.hints.length}
          </button>
        )}
      </div>

      <div className="problem-brief__actions">
        <button className="tool-btn tool-btn--accent" onClick={runScore}>Score my design</button>
        <button className="tool-btn" onClick={loadSample}>Load reference design</button>
      </div>
      <p className="dim small-print">
        Scoring tests your design at the problem&apos;s full load ({formatQps(r.readQps + r.writeQps)} req/s) analytically;
        the live Run stays at your generators&apos; rate.
      </p>
    </div>
  );
}

export default function ProblemsPanel() {
  const activeProblemId = useUiStore((s) => s.activeProblemId);
  const setActiveProblem = useUiStore((s) => s.setActiveProblem);
  const active = PROBLEMS.find((p) => p.id === activeProblemId);

  if (active) {
    return <div className="palette-scroll"><ProblemBrief key={active.id} problem={active} /></div>;
  }
  return (
    <div className="palette-scroll">
      <p className="dim problems-intro">Pick a problem. Its requirements become the target that Score and Capacity measure against.</p>
      <div className="problem-list">
        {PROBLEMS.map((p) => (
          <button key={p.id} className="problem-card" onClick={() => setActiveProblem(p.id)}>
            <div className="problem-card__head">
              <span className="problem-card__title">{p.title}</span>
              <span className={`difficulty difficulty--${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
            </div>
            <div className="problem-card__meta mono">
              {formatQps(p.requirements.readQps + p.requirements.writeQps)} req/s · p99 {p.requirements.p99Ms} ms
            </div>
            <div className="problem-card__tags">{p.tags.join(' · ')}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
