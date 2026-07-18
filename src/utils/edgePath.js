// Builds a right-angle "PCB trace" path between two handles, and exposes
// pointAtProgress() so edge pulses can be placed exactly on the drawn line.
export function buildStepPath(sourceX, sourceY, targetX, targetY) {
  const midX = sourceX + (targetX - sourceX) / 2;
  const points = [
    [sourceX, sourceY],
    [midX, sourceY],
    [midX, targetY],
    [targetX, targetY],
  ];
  const segments = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segments.push({ x1, y1, x2, y2, len });
    total += len;
  }
  const d = `M ${points[0][0]},${points[0][1]} L ${points[1][0]},${points[1][1]} L ${points[2][0]},${points[2][1]} L ${points[3][0]},${points[3][1]}`;

  function pointAtProgress(t) {
    const target = Math.max(0, Math.min(1, t)) * total;
    let acc = 0;
    for (const seg of segments) {
      if (seg.len === 0) continue;
      if (acc + seg.len >= target || seg === segments[segments.length - 1]) {
        const localT = seg.len === 0 ? 0 : (target - acc) / seg.len;
        return {
          x: seg.x1 + (seg.x2 - seg.x1) * localT,
          y: seg.y1 + (seg.y2 - seg.y1) * localT,
        };
      }
      acc += seg.len;
    }
    return { x: targetX, y: targetY };
  }

  const midY = (sourceY + targetY) / 2;
  return { d, pointAtProgress, labelX: midX, labelY: midY };
}
