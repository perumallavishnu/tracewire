import { useId, useState } from 'react';

// One-open-at-a-time accordion. Heights animate through a 0fr -> 1fr grid row, so an
// answer of any length eases open and shut without measuring it.
export default function Accordion({ items, initial = 0 }) {
  const [open, setOpen] = useState(initial);
  const base = useId();
  return (
    <div className="faq__list">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} className={`faq__item${isOpen ? ' is-open' : ''}`} data-reveal>
            <h3 className="faq__q">
              <button
                type="button"
                id={`${base}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-a${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{q}</span>
                <span className="faq__plus" aria-hidden="true" />
              </button>
            </h3>
            <div className="faq__panel" id={`${base}-a${i}`} role="region" aria-labelledby={`${base}-q${i}`}>
              <div className="faq__panel-inner">
                <p>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
