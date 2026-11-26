// The Pomodoro rhythm for one session: focus blocks with short breaks between,
// adding up to the session's planned minutes.

export type Segment = { kind: 'focus' | 'break'; minutes: number }

export function segmentsFor(total: number, focus: number, rest: number): Segment[] {
  const out: Segment[] = []
  let left = Math.max(1, total)
  while (left > 0) {
    const block = Math.min(focus, left)
    out.push({ kind: 'focus', minutes: block })
    left -= block
    if (left > 0) out.push({ kind: 'break', minutes: rest })
  }
  return out
}

/** "04:59" */
export function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
