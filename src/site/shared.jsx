import Logo from '../components/Logo';

// The one motif: Tracewire's right-angled trace with a request pulse riding it.
// Drawn from the same step geometry the simulator uses for its connections.
export function Trace({ className = '', d, width = 1000, height = 600, stroke = 64, pulse = true, label }) {
  const path = d || `M -40 ${height * 0.78} H ${width * 0.38} V ${height * 0.3} H ${width * 0.7} V ${height * 0.62} H ${width + 40}`;
  return (
    <svg
      className={`trace ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="miter" strokeLinecap="square" />
      {pulse && (
        <circle r={stroke * 0.32} className="trace__pulse">
          <animateMotion dur="5.5s" repeatCount="indefinite" path={path} rotate="auto" />
        </circle>
      )}
    </svg>
  );
}

// Small version of the motif used as a list bullet.
export function TraceBullet({ tone = 'signal' }) {
  return (
    <svg className={`trace-bullet trace-bullet--${tone}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M0 18 H9 V6 H24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
      <rect x="15" y="2" width="8" height="8" fill="currentColor" />
    </svg>
  );
}

export function SiteNav({ current }) {
  const links = [
    ['roadmap', 'Roadmap', '/roadmap'],
    ['learn', 'Lessons', '/learn/how-the-web-works'],
    ['sim', 'Simulator', '/sim'],
  ];
  return (
    <header className="site-nav">
      <a className="site-nav__mark" href="/" aria-label="Tracewire home"><Logo size={30} /></a>
      <nav aria-label="Main">
        {links.map(([id, label, to]) => (
          <a key={id} href={to} aria-current={current === id ? 'page' : undefined}>{label}</a>
        ))}
        <a href="https://github.com/perumallavishnu/tracewire" rel="noreferrer">GitHub</a>
      </nav>
      <a className="btn btn--small" href="/roadmap">Start learning</a>
    </header>
  );
}
