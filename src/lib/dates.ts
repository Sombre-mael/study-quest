// Dates are local calendar days stored as 'YYYY-MM-DD' strings, so a plan
// never shifts by a day when it crosses a timezone or daylight-saving change.

export type ISODate = string

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function todayISO(): ISODate {
  return toISO(new Date())
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((fromISO(a).getTime() - fromISO(b).getTime()) / 86_400_000)
}

export function dayRange(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

/** "Tue 10" */
export function dayLabel(iso: ISODate): string {
  const d = fromISO(iso)
  return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${d.getDate()}`
}

/** "Tuesday 10 November" */
export function longDayLabel(iso: ISODate): string {
  return fromISO(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "NOV" */
export function monthShort(iso: ISODate): string {
  return fromISO(iso).toLocaleDateString('en-GB', { month: 'short' }).slice(0, 3).toUpperCase()
}

export function dayOfMonth(iso: ISODate): number {
  return fromISO(iso).getDate()
}

/** Monday of the week holding this day. */
export function weekStart(iso: ISODate): ISODate {
  const dow = (fromISO(iso).getDay() + 6) % 7
  return addDays(iso, -dow)
}

export function monthStart(iso: ISODate): ISODate {
  const d = fromISO(iso)
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const d = fromISO(iso)
  return toISO(new Date(d.getFullYear(), d.getMonth() + n, 1))
}

/** "November 2026" */
export function monthLabel(iso: ISODate): string {
  return fromISO(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/** "9 – 15 Nov" or "30 Nov – 6 Dec" */
export function weekLabel(start: ISODate): string {
  const a = fromISO(start)
  const b = fromISO(addDays(start, 6))
  const m = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' })
  return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${m(b)}` : `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`
}

export function isISODate(s: string | null): s is ISODate {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(fromISO(s).getTime())
}
