import { useEffect, useRef } from 'react';

// Adds .is-in to every [data-reveal] element inside the ref once it scrolls into view.
// Content is visible by default; the hidden start state only applies once JS has marked
// the document, so nothing stays invisible if this never runs.
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    document.documentElement.classList.add('js-reveal');
    const items = root.querySelectorAll('[data-reveal]');
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

export const CREDITS = [
  { file: 'switchboard-operator.jpg', title: 'Marine Field Telephone Switchboard Operator, Guadalcanal, circa 1942', by: 'Archives Branch, USMC History Division', licence: 'CC BY 2.0', url: 'https://commons.wikimedia.org/w/index.php?curid=109890737' },
  { file: 'telephone-exchange.jpg', title: '1940s N935 telephone exchange', by: 'Rodhullandemu', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/w/index.php?curid=66686359' },
  { file: 'arpanet-1977.png', title: 'Arpanet logical map, March 1977', by: 'ARPANET', licence: 'public domain', url: 'https://commons.wikimedia.org/wiki/File:Arpanet_logical_map,_march_1977.png' },
  { file: 'server-racks.jpg', title: 'Wikimedia racks ULSFO 2013 06 06 02', by: 'Mutante', licence: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/w/index.php?curid=26602336' },
  { file: 'rack-cables.jpg', title: 'Rear of rack at NERSC data center, closeup', by: 'Derrick Coetzee', licence: 'CC0', url: 'https://commons.wikimedia.org/w/index.php?curid=17460421' },
];
