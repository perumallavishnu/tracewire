import { useEffect, useRef, useState } from 'react';
import { useInViewOnce } from './siteUtils';

// Renders the final value for crawlers and reduced motion; otherwise counts up from `from`
// the first time the number scrolls into view.
export default function CountUp({ to, from = 0, duration = 1400, delay = 0, format = (v) => Math.round(v), className }) {
  const ref = useRef(null);
  const seen = useInViewOnce(ref);
  const [value, setValue] = useState(to);
  const started = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!started.current) setValue(from);
    if (!seen || started.current) return undefined;
    started.current = true;
    let frame = 0;
    let start = 0;
    const step = (now) => {
      if (!start) start = now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setValue(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [seen, to, from, duration, delay]);

  return <span ref={ref} className={className}>{format(value)}</span>;
}
