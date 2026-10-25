import { useEffect } from 'react';
import { PHASES } from '../../interview/phases';
import { useUiStore } from '../../store/useUiStore';

function clock(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function InterviewBar() {
  const iv = useUiStore((s) => s.interview);
  const tickInterview = useUiStore((s) => s.tickInterview);
  const setPhase = useUiStore((s) => s.setPhase);
  const endInterview = useUiStore((s) => s.endInterview);
  const togglePause = useUiStore((s) => s.toggleInterviewPause);
  const runScore = useUiStore((s) => s.runScore);
  const setRightTab = useUiStore((s) => s.setRightTab);

  useEffect(() => {
    if (!iv.active) return undefined;
    const t = setInterval(() => tickInterview(1), 1000);
    return () => clearInterval(t);
  }, [iv.active, tickInterview]);

  if (!iv.active) return <div className="interview-bar is-hidden" />;

  const phase = PHASES[iv.phase];
  const inPhase = iv.elapsedSec - iv.phaseStartSec;
  const over = inPhase > phase.minutes * 60;
  const totalTarget = PHASES.reduce((s, p) => s + p.minutes, 0);
  const last = iv.phase === PHASES.length - 1;

  return (
    <div className="interview-bar" role="region" aria-label="Mock interview">
      <div className="interview-bar__phases">
        {PHASES.map((p, i) => (
          <button
            key={p.name}
            className={`interview-step${i === iv.phase ? ' is-current' : ''}${i < iv.phase ? ' is-done' : ''}`}
            onClick={() => setPhase(i)}
            title={`${p.minutes} min target`}
          >
            <span className="mono">{i + 1}</span> {p.name}
          </button>
        ))}
      </div>
      <div className="interview-bar__prompts">
        {phase.prompts.map((p) => <span key={p}>{p}</span>)}
      </div>
      <div className="interview-bar__timer">
        <span className={`mono${over ? ' is-over' : ''}`} title="time in this phase / target">
          {clock(inPhase)} / {phase.minutes}:00
        </span>
        <span className="mono dim" title="total elapsed / total target">{clock(iv.elapsedSec)} of {totalTarget}:00</span>
        <button className="tool-btn" onClick={togglePause}>{iv.paused ? 'Resume' : 'Pause'}</button>
        {phase.name === 'Estimate' && <button className="tool-btn" onClick={() => setRightTab('capacity')}>Capacity</button>}
        {last ? (
          <button className="tool-btn tool-btn--accent" onClick={runScore}>Score</button>
        ) : (
          <button className="tool-btn tool-btn--accent" onClick={() => setPhase(iv.phase + 1)}>Next phase</button>
        )}
        <button className="tool-btn" onClick={endInterview}>End</button>
      </div>
    </div>
  );
}
