// The Tracewire mark: a right-angled trace wire ending in a node, with a request pulse on it.
// Same drawing as public/favicon.svg.
export default function Logo({ size = 28, withWord = true, className = '' }) {
  return (
    <span className={`tw-logo ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="7" fill="#0b0e11" />
        <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.4" fill="none" stroke="#232b32" strokeWidth="1.5" />
        <path d="M5 23 H13 V10 H22" fill="none" stroke="#4fd1c5" strokeWidth="3.6" strokeLinecap="square" />
        <rect x="21" y="6" width="8" height="8" fill="#4fd1c5" />
        <circle className="tw-logo__pulse" cx="13" cy="16.5" r="2.1" fill="#e6edf3" />
      </svg>
      {withWord && <span className="tw-logo__word">Tracewire</span>}
    </span>
  );
}
