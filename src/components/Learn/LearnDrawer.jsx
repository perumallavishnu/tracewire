import { useEffect, useState } from 'react';
import { CONCEPTS, COMPARISONS } from '../../learn/concepts';
import { useUiStore } from '../../store/useUiStore';

export default function LearnDrawer() {
  const open = useUiStore((s) => s.learnOpen);
  const setLearnOpen = useUiStore((s) => s.setLearnOpen);
  const [tab, setTab] = useState('concepts');

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setLearnOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setLearnOpen]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={() => setLearnOpen(false)}>
      <div className="learn-drawer" role="dialog" aria-modal="true" aria-label="Learn" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="panel-tabs panel-tabs--inline" role="tablist">
            <button role="tab" aria-selected={tab === 'concepts'} className={`panel-tab${tab === 'concepts' ? ' is-active' : ''}`} onClick={() => setTab('concepts')}>Concepts</button>
            <button role="tab" aria-selected={tab === 'compare'} className={`panel-tab${tab === 'compare' ? ' is-active' : ''}`} onClick={() => setTab('compare')}>This vs that</button>
          </div>
          <button className="modal__close" onClick={() => setLearnOpen(false)} aria-label="Close">×</button>
        </div>
        <div className="learn-drawer__body">
          {tab === 'concepts'
            ? CONCEPTS.map((c) => (
                <article key={c.id} className="learn-card">
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  {c.tryIt && <p className="learn-card__try"><span className="eyebrow small">Try it</span> {c.tryIt}</p>}
                </article>
              ))
            : COMPARISONS.map((c) => (
                <article key={c.id} className="learn-card">
                  <h3>{c.a} <span className="dim">vs</span> {c.b}</h3>
                  <div className="compare-cols">
                    <div><div className="eyebrow small tradeoff-pro">Choose {c.a.toLowerCase()} when</div><p>{c.aWhen}</p></div>
                    <div><div className="eyebrow small tradeoff-alt-label">Choose {c.b.toLowerCase()} when</div><p>{c.bWhen}</p></div>
                  </div>
                  <p className="dim">{c.note}</p>
                </article>
              ))}
        </div>
      </div>
    </div>
  );
}
