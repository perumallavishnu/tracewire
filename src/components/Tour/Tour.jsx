import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import './tour.css';

// First-run guide for the simulator. Each step spotlights one region: the rest of the app is
// dimmed and slightly blurred by four panels around the target, and a card explains it.
// Opens automatically once; the toolbar's Guide button replays it.

export const TOUR_SEEN_KEY = 'tracewire:tour-seen:v1';

const STEPS = [
  {
    target: '.toolbar__controls',
    title: 'Run, pace and score',
    body: 'Run starts live traffic through your design (Space does the same). The speed buttons slow down or fast-forward simulated time, Reset sim clears the metrics, and Score grades the design out of 100.',
  },
  {
    target: '.toolbar__study',
    title: 'Practise and learn',
    body: 'Practice interview runs six timed phases, from clarifying requirements to the deep dive. Learn opens concept cards and this-versus-that comparisons.',
  },
  {
    target: '.toolbar__file-ops',
    title: 'Save and share',
    body: 'Start a new canvas, load the example, or import and export designs as JSON files. Your latest design is also saved in this browser automatically.',
  },
  {
    target: '.palette',
    prepare: (ui) => ui.setLeftTab('components'),
    title: 'Components',
    body: 'Thirty-nine building blocks in six groups. Drag one onto the canvas, or focus it and press Enter. Search filters the list, and the right edge of this panel drags to resize it.',
  },
  {
    target: '.palette .panel-tabs',
    title: 'Practice problems',
    body: 'The Problems tab holds eight design problems with real requirements, hints and a reference design. Choosing one makes Score and Capacity test your design at its load.',
  },
  {
    target: '.flow-canvas',
    title: 'The canvas',
    body: 'Drag from the dot on the right of a component to the left of another to connect them. Click anything to select it, press Delete to remove it. While running, the moving dots are live requests.',
  },
  {
    target: '.chaos-dock',
    title: 'Break things on purpose',
    body: 'Chaos monkey randomly kills nodes, spikes latency and drops capacity while the simulation runs. Active incidents are listed here as they happen.',
  },
  {
    target: '.inspector .panel-tabs',
    prepare: (ui) => ui.setRightTab('inspect'),
    title: 'Inspect, trade-offs, capacity, score',
    body: 'Inspect edits the selected component and injects failures into it. Trade-offs explains its gains and costs, Capacity sizes replicas for the load, and Score shows the full breakdown with fixes.',
  },
  {
    target: '.metrics-dock__stats',
    title: 'Live numbers',
    body: 'Throughput, error rate and p50, p95 and p99 latency, measured over the last eight seconds of simulated time.',
  },
  {
    target: '.metrics-dock__charts',
    title: 'Charts over time',
    body: 'The same metrics as charts: simulated seconds along the bottom, the value and its unit up the side. Hover a line for the exact reading.',
  },
  {
    target: '.metrics-dock__log',
    title: 'Event feed',
    body: 'Every failure, retry, circuit opening and recovery, newest first. It is the quickest way to see why a number moved.',
  },
  {
    target: '.toolbar__help',
    title: 'Come back any time',
    body: 'This button replays the guide whenever you need it. Now load the example, press Run, and break something.',
  },
];

const PAD = 8;
const CARD_W = 360;

function rectOf(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

// card goes below the target if it fits, else above, else beside it; always inside the viewport
function cardPosition(r, cardH) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 14;
  let top;
  let left = Math.min(Math.max(16, r.left), vw - CARD_W - 16);
  if (r.top + r.height + gap + cardH < vh - 16) top = r.top + r.height + gap;
  else if (r.top - gap - cardH > 16) top = r.top - gap - cardH;
  else {
    top = Math.min(Math.max(16, r.top), vh - cardH - 16);
    left = r.left + r.width + gap + CARD_W < vw - 16 ? r.left + r.width + gap : Math.max(16, r.left - gap - CARD_W);
  }
  return { top, left };
}

export default function Tour() {
  const open = useUiStore((s) => s.tourOpen);
  const setTourOpen = useUiStore((s) => s.setTourOpen);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardH, setCardH] = useState(220);
  const cardRef = useRef(null);
  const nextRef = useRef(null);

  const close = useCallback(() => {
    setTourOpen(false);
    try {
      localStorage.setItem(TOUR_SEEN_KEY, '1');
    } catch (e) {
      // storage unavailable — the guide may open again next visit
    }
  }, [setTourOpen]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // measure the target (after any panel switch the step needs) and keep it measured
  useLayoutEffect(() => {
    if (!open) return undefined;
    const s = STEPS[step];
    s.prepare?.(useUiStore.getState());
    let raf = requestAnimationFrame(() => setRect(rectOf(s.target)));
    const onResize = () => setRect(rectOf(s.target));
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [open, step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
    nextRef.current?.focus({ preventScroll: true });
  }, [rect, step]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') setStep((s) => Math.min(STEPS.length - 1, s + 1));
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, close]);

  if (!open || !rect) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pos = cardPosition(rect, cardH);
  const r = {
    top: Math.max(0, rect.top),
    left: Math.max(0, rect.left),
    right: Math.min(vw, rect.left + rect.width),
    bottom: Math.min(vh, rect.top + rect.height),
  };

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {/* four dimmed, blurred panels around the spotlight; clicking them does nothing */}
      <div className="tour__shade" style={{ top: 0, left: 0, width: vw, height: r.top }} />
      <div className="tour__shade" style={{ top: r.bottom, left: 0, width: vw, height: vh - r.bottom }} />
      <div className="tour__shade" style={{ top: r.top, left: 0, width: r.left, height: r.bottom - r.top }} />
      <div className="tour__shade" style={{ top: r.top, left: r.right, width: vw - r.right, height: r.bottom - r.top }} />
      <div className="tour__ring" style={{ top: r.top, left: r.left, width: r.right - r.left, height: r.bottom - r.top }} />

      <div ref={cardRef} className="tour__card" style={{ top: pos.top, left: pos.left, width: CARD_W }} key={step}>
        <div className="tour__head">
          <span className="tour__count">Step {step + 1} of {STEPS.length}</span>
          <button type="button" className="tour__close" onClick={close} aria-label="Close the guide"><X size={18} /></button>
        </div>
        <h2 id="tour-title" className="tour__title">{s.title}</h2>
        <p id="tour-body" className="tour__body">{s.body}</p>
        <div className="tour__progress" aria-hidden="true">
          {STEPS.map((_, i) => <span key={i} className={i <= step ? 'is-done' : ''} />)}
        </div>
        <div className="tour__actions">
          <button type="button" className="tour__skip" onClick={close}>{last ? 'Close' : 'Skip guide'}</button>
          <span className="tour__nav">
            {step > 0 && <button type="button" className="tour__btn" onClick={() => setStep(step - 1)}>Back</button>}
            <button ref={nextRef} type="button" className="tour__btn tour__btn--primary" onClick={() => (last ? close() : setStep(step + 1))}>
              {last ? 'Got it' : 'Next'}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
