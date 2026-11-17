// Shown in the hero while the interactive rack's code loads: the same card frame, with four
// isometric server blades dropping into place one after another. Pure SVG + CSS, so it is
// part of the first paint and costs no extra request.

const W = 80; // half the width of a blade's top face
const DEPTH = 40; // isometric rise of the top face
const T = 24; // blade thickness
const GAP = 6;
const CX = 120;
const BASE = 150; // y of the bottom blade's top face

function Blade({ i }) {
  const y = BASE - i * (T + GAP);
  const top = `${CX},${y} ${CX + W},${y + DEPTH} ${CX},${y + 2 * DEPTH} ${CX - W},${y + DEPTH}`;
  const left = `${CX - W},${y + DEPTH} ${CX},${y + 2 * DEPTH} ${CX},${y + 2 * DEPTH + T} ${CX - W},${y + DEPTH + T}`;
  const right = `${CX},${y + 2 * DEPTH} ${CX + W},${y + DEPTH} ${CX + W},${y + DEPTH + T} ${CX},${y + 2 * DEPTH + T}`;
  // three status lights along the front-right face, following its slope
  const leds = [0.25, 0.45, 0.65].map((f) => ({ x: CX + W * f, y: y + 2 * DEPTH - DEPTH * f + T / 2 }));
  return (
    <g className="rack-load__blade" style={{ '--i': i }}>
      <polygon className="rack-load__left" points={left} />
      <polygon className="rack-load__right" points={right} />
      <polygon className="rack-load__top" points={top} />
      {leds.map((p, k) => (
        <circle key={k} className="rack-load__led" style={{ '--k': k }} cx={p.x} cy={p.y} r="2.6" />
      ))}
    </g>
  );
}

export default function RackLoader() {
  return (
    <div className="rack-load" role="status">
      <div className="rack-load__row">
        <span className="rack-load__pill" style={{ width: 150 }} />
      </div>
      <div className="rack-load__stage">
        <svg className="rack-load__art" viewBox="0 0 240 280" aria-hidden="true">
          <polygon className="rack-load__floor" points={`${CX},${BASE + 2 * DEPTH + T - 4} ${CX + W + 24},${BASE + DEPTH + T + 8} ${CX},${BASE + T + 20} ${CX - W - 24},${BASE + DEPTH + T + 8}`} />
          {[0, 1, 2, 3].map((i) => <Blade key={i} i={i} />)}
        </svg>
        <p className="rack-load__label">Racking the servers</p>
        <span className="rack-load__progress" aria-hidden="true"><span /></span>
      </div>
      <div className="rack-load__row rack-load__row--foot">
        <span className="rack-load__pill" style={{ width: 230 }} />
        <span className="rack-load__pill" style={{ width: 120 }} />
      </div>
    </div>
  );
}
