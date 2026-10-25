import { useUiStore } from '../../store/useUiStore';

const TONE_COLOR = {
  signal: 'var(--accent-signal)',
  info: 'var(--accent-info)',
  warn: 'var(--accent-warn)',
  error: 'var(--accent-error)',
};

export default function ScorePanel() {
  const score = useUiStore((s) => s.score);
  const runScore = useUiStore((s) => s.runScore);
  const problem = useUiStore((s) => s.activeProblem());

  if (!score) {
    return (
      <div className="inspector-body">
        <p className="dim">
          Score grades the current design out of 100 on requirements, scalability, availability, latency and cost.
          {problem ? ` It tests against "${problem.title}".` : ' Pick a problem on the left to score against its requirements, or score in free mode using your generator rates.'}
        </p>
        <button className="tool-btn tool-btn--accent" onClick={runScore}>Score design</button>
      </div>
    );
  }

  const color = TONE_COLOR[score.tone];
  return (
    <div className="inspector-body">
      <div className="score-head">
        <div className="score-total mono" style={{ color }}>{score.total}<span className="dim">/100</span></div>
        <div>
          <div className="score-verdict" style={{ color }}>{score.verdict}</div>
          <div className="dim score-context">{problem ? problem.title : 'Free mode'}</div>
        </div>
      </div>
      <button className="tool-btn" onClick={runScore}>Re-score</button>

      {score.categories.map((c) => (
        <section key={c.name} className="score-cat">
          <div className="score-cat__head">
            <span>{c.name}</span>
            <span className="mono">{c.score}/{c.max}</span>
          </div>
          <div className="cap-bar"><div style={{ width: `${(c.score / c.max) * 100}%`, background: color }} /></div>
          <ul className="score-checks">
            {c.checks.map((k) => (
              <li key={k.label} className={k.points >= k.max ? 'is-pass' : 'is-miss'}>
                <span className="score-checks__mark" aria-hidden="true">{k.points >= k.max ? '✓' : '○'}</span>
                <div>
                  <div>{k.label} <span className="dim mono">{k.points}/{k.max}</span></div>
                  {k.tip && <div className="score-checks__tip">{k.tip}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
