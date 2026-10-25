// Compact human-readable numbers for rates and sizes.
export function formatQps(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return `${Math.round(n)}`;
}

export function formatGb(gb) {
  if (gb >= 1e6) return `${(gb / 1e6).toFixed(1)} PB`;
  if (gb >= 1e3) return `${(gb / 1e3).toFixed(1)} TB`;
  return `${gb} GB`;
}
