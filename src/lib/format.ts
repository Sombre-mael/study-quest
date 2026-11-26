/** Card pill: "30 min", "1h", "1h 30m". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Column footer: the same, but an empty day reads "Free". */
export function formatTotal(minutes: number): string {
  return minutes === 0 ? 'Free' : formatDuration(minutes)
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}
