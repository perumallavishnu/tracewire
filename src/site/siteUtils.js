import { useEffect, useRef, useState } from 'react';

// Adds .is-in to every [data-reveal] element inside the ref once it scrolls into view.
// Content is visible by default; the hidden start state only applies once JS has marked
// the document, so nothing stays invisible if this never runs.
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const items = root.querySelectorAll('[data-reveal]');
    // hydrating build-time HTML: whatever is already on screen stays put instead of
    // vanishing and fading back in
    if (document.getElementById('root')?.hasAttribute('data-ssr')) {
      const fold = window.innerHeight;
      items.forEach((el) => { if (el.getBoundingClientRect().top < fold) el.classList.add('is-in'); });
    }
    document.documentElement.classList.add('js-reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

// True once the element has scrolled into view (and stays true).
export function useInViewOnce(ref, margin = '0px 0px -15% 0px') {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return seen;
}
