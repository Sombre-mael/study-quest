import { defaultTarget, readinessWindowDays, type Item, type LogEntry, type Settings } from '../data'
import { addDays, diffDays, type ISODate } from './dates'

// Pure numbers behind the progress page, the readiness meters and the daily
// limit. Everything takes plain state so it is easy to test or move server-side.

export function dayLoad(items: Item[], date: ISODate): number {
  return items.reduce((sum, i) => sum + (i.date === date && i.kind === 'session' ? i.minutes : 0), 0)
}

export function overBy(items: Item[], date: ISODate, settings: Settings): number {
  if (!settings.dailyLimit) return 0
  return Math.max(0, dayLoad(items, date) - settings.dailyLimit)
}

export type Move = { id: string; to: ISODate }

/**
 * Move sessions off an overloaded day until it fits the daily limit. The last
 * sessions of the day go first, each to the nearest day (later first, never
 * before today) with room for it. A session planned for a test never moves to
 * the test day or after it. Done sessions and tests stay put.
 */
export function rebalance(items: Item[], date: ISODate, limit: number, today: ISODate): { moves: Move[]; left: number } {
  const loads = new Map<ISODate, number>()
  const load = (d: ISODate) => loads.get(d) ?? dayLoad(items, d)
  const tests = new Map(items.filter((i) => i.kind === 'test').map((t) => [t.id, t.date]))
  const movable = items
    .filter((i) => i.date === date && i.kind === 'session' && !i.done)
    .sort((a, b) => b.order - a.order)
  let total = load(date)
  const moves: Move[] = []
  for (const s of movable) {
    if (total <= limit) break
    const deadline = s.testId ? tests.get(s.testId) : undefined
    for (let k = 1; k <= 21; k++) {
      const options = [addDays(date, k), addDays(date, -k)].filter((d) => d >= today && (!deadline || d < deadline))
      const to = options.find((d) => load(d) + s.minutes <= limit)
      if (to) {
        moves.push({ id: s.id, to })
        loads.set(to, load(to) + s.minutes)
        total -= s.minutes
        break
      }
    }
  }
  return { moves, left: Math.max(0, total - limit) }
}

export type Readiness = {
  /** Share of the target already studied, 0..1. */
  done: number
  /** Share studied plus what is still planned before the test, 0..1. */
  planned: number
  target: number
  studied: number
}

/** How ready you are for a test: study on its subject in the weeks before it. */
export function readiness(test: Item, items: Item[], log: LogEntry[], today: ISODate): Readiness {
  const from = addDays(test.date, -readinessWindowDays)
  const linked = items.filter((i) => i.kind === 'session' && i.testId === test.id)
  const target = test.target || linked.reduce((a, s) => a + s.minutes, 0) || defaultTarget
  const studied = log
    .filter((l) => l.subject === test.subject && l.date >= from && l.date < test.date && l.date <= today)
    .reduce((a, l) => a + l.minutes, 0)
  const ahead = items
    .filter((i) => i.kind === 'session' && !i.done && i.date >= today && i.date < test.date && (i.testId === test.id || i.subject === test.subject))
    .reduce((a, s) => a + s.minutes, 0)
  return { done: Math.min(1, studied / target), planned: Math.min(1, (studied + ahead) / target), target, studied }
}

/** Days of streak that earn one shield. */
export const STREAK_DAYS_PER_SHIELD = 7
/** Shields held at once. Spare ones earned at the cap are lost. */
export const MAX_STREAK_SHIELDS = 2
/**
 * How far back a shield may pay for a missed day. A gap older than this is
 * history: the run already restarted after it, so rewriting it would inflate
 * the streak with study from before the break.
 */
export const STREAK_FREEZE_WINDOW_DAYS = 7

/** The streak shields a planner owns. */
export type Shields = {
  /** Shields left to spend. */
  available: number
  /** 7-day milestones already credited, so a spent shield is not re-earned. */
  milestones: number
  /** Days a shield already covered; they keep the run alive without counting. */
  frozen: ISODate[]
}

export const noShields: Shields = { available: 0, milestones: 0, frozen: [] }

export type StreakInfo = {
  days: number
  studiedToday: boolean
  shields: Shields
  /** Days until the next shield, or null when the stock is full. */
  nextIn: number | null
}

/**
 * The current run, with shields spent on missed days. Walking backwards stops
 * at the first day that is neither studied nor already frozen, unless a shield
 * can pay for it. Frozen days never add to the count: they only keep it alive.
 * Milestones are credited once, so spending a shield does not earn it straight
 * back.
 */
export function resolveStreak(log: LogEntry[], today: ISODate, current: Shields = noShields): StreakInfo {
  const studied = new Set(log.filter((l) => l.minutes > 0).map((l) => l.date))
  const studiedToday = studied.has(today)
  const frozen = new Set(current.frozen)
  let available = Math.max(0, Math.floor(current.available))
  let days = 0
  let d = studiedToday ? today : addDays(today, -1)
  // A year and a bit of history is plenty; the loop never runs forever.
  for (let i = 0; i < 420; i++) {
    if (studied.has(d)) {
      days++
      d = addDays(d, -1)
      continue
    }
    if (frozen.has(d)) {
      d = addDays(d, -1)
      continue
    }
    if (available > 0 && diffDays(today, d) <= STREAK_FREEZE_WINDOW_DAYS) {
      available--
      frozen.add(d)
      d = addDays(d, -1)
      continue
    }
    break
  }
  const milestones = Math.floor(days / STREAK_DAYS_PER_SHIELD)
  if (milestones > current.milestones) {
    available = Math.min(MAX_STREAK_SHIELDS, available + (milestones - current.milestones))
  }
  return {
    days,
    studiedToday,
    shields: { available, milestones: Math.max(current.milestones, milestones), frozen: [...frozen].sort() },
    nextIn: available >= MAX_STREAK_SHIELDS ? null : STREAK_DAYS_PER_SHIELD - (days % STREAK_DAYS_PER_SHIELD),
  }
}

/** Days in a row, ending today or yesterday, with any logged study. */
export function streak(log: LogEntry[], today: ISODate): { days: number; studiedToday: boolean } {
  const { days, studiedToday } = resolveStreak(log, today)
  return { days, studiedToday }
}

export function minutesBySubject(log: LogEntry[], from: ISODate | null, to: ISODate): Map<string, number> {
  const m = new Map<string, number>()
  for (const l of log) {
    if ((from && l.date < from) || l.date > to) continue
    m.set(l.subject, (m.get(l.subject) ?? 0) + l.minutes)
  }
  return m
}

export function minutesOn(log: LogEntry[], date: ISODate): number {
  return log.reduce((a, l) => a + (l.date === date ? l.minutes : 0), 0)
}

/** "aujourd'hui", "demain", "dans 5 jours", "il y a 2 jours". */
export function countdown(date: ISODate, today: ISODate): string {
  const n = diffDays(date, today)
  if (n === 0) return 'aujourd’hui'
  if (n === 1) return 'demain'
  if (n === -1) return 'hier'
  return n > 0 ? `dans ${n} jours` : `il y a ${-n} jours`
}
