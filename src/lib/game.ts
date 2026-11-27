import type { Item, LogEntry } from '../data'
import { diffDays, type ISODate } from './dates'
import { readiness, streak } from './insights'

// The game layer on top of the planner. Everything here is derived from the
// same study record the rest of the app uses (log + items), so a level or a
// badge can never drift out of sync with the real minutes studied.

export const XP_PER_MINUTE = 1
/** Bonus for ticking a session off rather than just logging minutes. */
export const XP_PER_TICK = 15
export const WARM_UP_PAIRS = 4
/** Warm-up games that pay bonus XP each day. The rest are practice only. */
export const WARM_UP_DAILY_LIMIT = 3

/** Cumulative XP needed to reach a level. Level 1 starts at 0. */
export function levelXp(level: number): number {
  const n = Math.max(1, Math.floor(level)) - 1
  return 120 * n + 40 * n * n
}

const RANKS: Array<{ at: number; name: string }> = [
  { at: 16, name: 'Légende' },
  { at: 12, name: 'Maître' },
  { at: 9, name: 'Adepte' },
  { at: 6, name: 'Érudit' },
  { at: 4, name: 'Apprenti' },
  { at: 1, name: 'Explorateur' },
]

export function rankFor(level: number): string {
  return (RANKS.find((r) => level >= r.at) ?? RANKS[RANKS.length - 1]!).name
}

export type LevelProgress = {
  /** All XP earned so far. */
  xp: number
  level: number
  rank: string
  /** XP inside the current level. */
  into: number
  /** XP the current level spans. */
  span: number
  toNext: number
  /** 0..1 through the current level. */
  ratio: number
}

export function totalXp(log: LogEntry[], bonusXp = 0): number {
  let xp = bonusXp
  for (const l of log) xp += l.minutes + (l.source === 'done' ? XP_PER_TICK : 0)
  return Math.max(0, Math.round(xp))
}

export function levelProgress(xp: number): LevelProgress {
  let level = 1
  while (level < 99 && xp >= levelXp(level + 1)) level++
  const floor = levelXp(level)
  const ceil = levelXp(level + 1)
  const span = Math.max(1, ceil - floor)
  const into = Math.max(0, xp - floor)
  return { xp, level, rank: rankFor(level), into, span, toNext: Math.max(0, ceil - xp), ratio: Math.min(1, into / span) }
}

/** XP a session is worth when it is ticked off. */
export function xpFor(item: Item): number {
  return item.kind === 'session' ? item.minutes + XP_PER_TICK : 0
}

/** The streak multiplies what today is worth. Shown on the HUD and the quest log. */
export function streakBoost(days: number): number {
  if (days >= 14) return 2
  if (days >= 7) return 1.5
  if (days >= 3) return 1.25
  return 1
}

export type Quest = {
  id: string
  title: string
  detail: string
  xp: number
  value: number
  target: number
  unit: string
  done: boolean
}

/** Today's quests. They reset every midnight because they read only today. */
export function dailyQuests(log: LogEntry[], today: ISODate): Quest[] {
  const todayLog = log.filter((l) => l.date === today)
  const minutes = todayLog.reduce((a, l) => a + l.minutes, 0)
  const ticks = todayLog.filter((l) => l.source === 'done').length
  const subjects = new Set(todayLog.map((l) => l.subject)).size
  return [
    { id: 'warm-up', title: 'Échauffement', detail: 'Étudie 15 minutes aujourd’hui', xp: 40, value: Math.min(minutes, 15), target: 15, unit: 'min', done: minutes >= 15 },
    { id: 'switch', title: 'Change de matière', detail: 'Touche 2 matières différentes aujourd’hui', xp: 50, value: Math.min(subjects, 2), target: 2, unit: 'matières', done: subjects >= 2 },
    { id: 'double', title: 'Double service', detail: 'Coche 2 séances aujourd’hui', xp: 60, value: Math.min(ticks, 2), target: 2, unit: 'séances', done: ticks >= 2 },
    { id: 'deep', title: 'Plongée profonde', detail: 'Une heure complète de travail aujourd’hui', xp: 100, value: Math.min(minutes, 60), target: 60, unit: 'min', done: minutes >= 60 },
  ]
}

export function questsDone(quests: Quest[]): number {
  return quests.filter((q) => q.done).length
}

export type BadgeIcon = 'sparkles' | 'flame' | 'hourglass' | 'trophy' | 'target' | 'compass'

export type Badge = {
  id: string
  title: string
  detail: string
  icon: BadgeIcon
  earned: boolean
  /** 0..1 towards earning it. */
  progress: number
}

export function badgesFor(items: Item[], log: LogEntry[], today: ISODate): Badge[] {
  const minutes = log.reduce((a, l) => a + l.minutes, 0)
  const ticks = log.filter((l) => l.source === 'done').length
  const s = streak(log, today)
  const pastTests = items.filter((t) => t.kind === 'test' && t.date <= today)
  const readyTests = pastTests.filter((t) => readiness(t, items, log, today).done >= 0.8).length
  const share = (value: number, target: number) => Math.max(0, Math.min(1, value / target))
  return [
    { id: 'first-step', title: 'Premier pas', detail: 'Enregistre tes premières minutes', icon: 'sparkles', earned: minutes > 0, progress: share(minutes, 1) },
    { id: 'week-one', title: 'Première semaine', detail: 'Tiens une série de 7 jours', icon: 'flame', earned: s.days >= 7, progress: share(s.days, 7) },
    { id: 'ten-hours', title: 'Dix heures au compteur', detail: 'Étudie 10 heures au total', icon: 'hourglass', earned: minutes >= 600, progress: share(minutes, 600) },
    { id: 'architect', title: 'Architecte', detail: 'Planifie 8 séances d’un coup', icon: 'compass', earned: items.length >= 8, progress: share(items.length, 8) },
    { id: 'finisher', title: 'Finisseur', detail: 'Coche 10 séances', icon: 'trophy', earned: ticks >= 10, progress: share(ticks, 10) },
    { id: 'boss-slayer', title: 'Tueur de boss', detail: 'Sois prêt à 80 % pour un contrôle', icon: 'target', earned: readyTests > 0, progress: share(readyTests, 1) },
  ]
}

export type Boss = {
  id: string
  title: string
  subject: string
  date: ISODate
  /** Study minutes the test needs. */
  maxHp: number
  /** Minutes still to study. */
  hp: number
  damage: number
  /** 0..1 studied against the target. */
  ready: number
  days: number
}

/** Upcoming tests as bosses: study minutes are damage, the target is the HP bar. */
export function bossesFor(items: Item[], log: LogEntry[], today: ISODate): Boss[] {
  return items
    .filter((t) => t.kind === 'test' && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const r = readiness(t, items, log, today)
      return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        date: t.date,
        maxHp: Math.max(1, r.target),
        hp: Math.max(0, r.target - r.studied),
        damage: r.studied,
        ready: r.done,
        days: diffDays(t.date, today),
      }
    })
}

/** The last thing you studied before today, for the warm-up deck. */
export function warmUpSubjects(items: Item[], log: LogEntry[], today: ISODate, fallback: string[]): string[] {
  const recent = new Set<string>()
  for (const l of [...log].filter((l) => l.date <= today).sort((a, b) => b.date.localeCompare(a.date))) recent.add(l.subject)
  for (const i of items.filter((i) => i.kind === 'session' && !i.done).sort((a, b) => a.date.localeCompare(b.date))) recent.add(i.subject)
  for (const id of fallback) recent.add(id)
  return [...recent]
}

export function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = out[i]!
    const b = out[j]!
    out[i] = b
    out[j] = a
  }
  return out
}

/** Card faces for the memory game: `pairs` subjects, each twice. */
export function warmUpDeck(subjects: string[], pairs = WARM_UP_PAIRS): string[] {
  const picked: string[] = []
  for (const id of subjects) {
    if (!picked.includes(id)) picked.push(id)
    if (picked.length === pairs) break
  }
  // Fewer subjects than pairs: repeat the ones there are.
  const base = [...picked]
  for (let i = 0; picked.length < pairs && base.length > 0; i++) picked.push(base[i % base.length]!)
  return shuffle([...picked, ...picked])
}

/** Bonus XP for a finished warm-up: fewer moves, more XP. */
export function warmUpReward(moves: number, pairs: number): number {
  return Math.max(10, 50 - Math.max(0, moves - pairs * 2) * 4)
}

/** How many warm-up games paid out today, keyed by day so it resets itself. */
export type WarmUp = { date: ISODate; plays: number }

export const emptyWarmUp: WarmUp = { date: '', plays: 0 }

export function warmUpLeft(warmUp: WarmUp | undefined, today: ISODate): number {
  const plays = warmUp?.date === today ? warmUp.plays : 0
  return Math.max(0, WARM_UP_DAILY_LIMIT - plays)
}

export type GameState = {
  quests: Quest[]
  questXp: number
  xp: number
  level: LevelProgress
  streak: { days: number; studiedToday: boolean }
  boost: number
  /** Warm-up games still paying XP today. */
  warmUpLeft: number
}

/** Everything the HUD, the quest log and the level-up banner need, in one pass. */
export function gameState(log: LogEntry[], today: ISODate, bonusXp = 0, warmUp?: WarmUp): GameState {
  const quests = dailyQuests(log, today)
  const questXp = quests.reduce((a, q) => a + (q.done ? q.xp : 0), 0)
  const xp = totalXp(log, bonusXp) + questXp
  const s = streak(log, today)
  return { quests, questXp, xp, level: levelProgress(xp), streak: s, boost: streakBoost(s.days), warmUpLeft: warmUpLeft(warmUp, today) }
}
