import { useEffect, useRef, useState } from 'react';
import { useInViewOnce } from './siteUtils';

// Live pieces for the close-up board: a kill/revive button that flips once, an interview
// timer that keeps ticking, and an event log that arrives line by line.

export function KillRevive() {
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  const [revived, setRevived] = useState(false);
  useEffect(() => {
    if (!seen) return undefined;
    const t = setTimeout(() => setRevived(true), 1300);
    return () => clearTimeout(t);
  }, [seen]);
  return (
    <div ref={ref} className={`ui-button${revived ? ' is-revive' : ''}`}>
      <span className="ui-button__a">Kill node</span>
      <span className="ui-button__b">Revive node</span>
    </div>
  );
}

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function InterviewTimer({ start = 252, target = 900 }) {
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  const [sec, setSec] = useState(start);
  useEffect(() => {
    if (!seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setSec((s) => (s + 1 > target ? start : s + 1)), 1000);
    return () => clearInterval(t);
  }, [seen, start, target]);
  return (
    <div ref={ref} className="ui-timer">{clock(sec)}<span> / {clock(target)}</span></div>
  );
}

const LOG = [
  ['6.8s', 'Node Redirect Service killed', ''],
  ['6.8s', 'Retrying request after node is down at Redirect Service', 'is-warn'],
  ['6.9s', 'Retrying request after node is down at Redirect Service', 'is-warn'],
  ['7.0s', 'Circuit opened at Circuit Breaker', 'is-warn'],
  ['9.1s', 'Node Redirect Service revived', 'is-ok'],
];

export function EventLog() {
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  return (
    <div ref={ref} className={`board__log${seen ? ' is-in' : ''}`}>
      {LOG.map(([t, msg, cls], i) => (
        <p key={i} className={cls} style={{ '--i': i }}><span>{t}</span>{msg}</p>
      ))}
    </div>
  );
}
