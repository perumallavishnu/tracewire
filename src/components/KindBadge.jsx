import { iconFor } from '../nodeDefs/icons';

// A component kind's icon, or its typed badge for custom kinds without one.
export default function KindBadge({ kind, glyph, className, size = 16 }) {
  const Icon = iconFor(kind);
  return (
    <span className={`${className}${Icon ? ' has-icon' : ''}`} aria-hidden="true">
      {Icon ? <Icon size={size} strokeWidth={1.75} /> : glyph}
    </span>
  );
}
