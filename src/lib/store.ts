import { useEffect, useReducer } from 'react'

import {
  defaultSettings,
  seedForNewUsers,
  seedItems,
  seedLog,
  seedSubjects,
  type Item,
  type LogEntry,
  type Settings,
  type Subject,
} from '../data'
import type { ISODate } from './dates'
import { uid } from './format'
import { noShields, resolveStreak, type Shields } from './insights'
import { emptyWarmUp, WARM_UP_DAILY_LIMIT, type Chest, type WarmUp } from './game'

// Everything lives in this browser's localStorage under one key. Swap load and
// the save effect for API calls to keep plans in a database instead.
const KEY = 'study-planner:v2'
const LEGACY_KEY = 'study-planner:v1'

export type State = {
  items: Item[]
  subjects: Subject[]
  log: LogEntry[]
  settings: Settings
  /** XP won in the warm-up game, never part of the study minutes. */
  bonusXp: number
  /** Today's paid warm-up games. */
  warmUp: WarmUp
  /** The last daily chest opened, kept so it can't pay twice a day. */
  chest: Chest | null
  /** Streak shields and the days they already saved. */
  shields: Shields
}

export type Action =
  | { type: 'add'; items: Item[] }
  | { type: 'update'; id: string; patch: Partial<Item> }
  | { type: 'remove'; ids: string[] }
  | { type: 'move'; id: string; date: ISODate; index: number }
  | { type: 'setDone'; id: string; done: boolean; today: ISODate; minutes?: number }
  | { type: 'logFocus'; subject: string; minutes: number; date: ISODate; itemId?: string }
  /** A cleared warm-up: pays XP while the daily limit lasts. */
  | { type: 'warmUp'; date: ISODate; xp: number }
  /** Opening the daily chest. */
  | { type: 'chest'; date: ISODate; xp: number }
  /** Spends a shield on a missed day, or credits a new 7-day milestone. */
  | { type: 'streakCheck'; today: ISODate }
  | { type: 'subject.save'; subject: Subject }
  | { type: 'subject.remove'; id: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'replace'; state: State }

function sortDay(items: Item[]) {
  return [...items].sort((a, b) => a.order - b.order)
}

/** Renumber one day's items 0..n in their current order. */
function renumber(items: Item[], date: ISODate, ordered?: Item[]): Item[] {
  const day = ordered ?? sortDay(items.filter((i) => i.date === date))
  const orders = new Map(day.map((it, i) => [it.id, i]))
  return items.map((it) => (orders.has(it.id) ? { ...it, order: orders.get(it.id)! } : it))
}

function itemsReducer(state: Item[], action: Action): Item[] {
  switch (action.type) {
    case 'add': {
      let next = [...state]
      for (const item of action.items) {
        const count = next.filter((i) => i.date === item.date).length
        // Tests go to the bottom of their day, sessions above any test.
        const firstTest = sortDay(next.filter((i) => i.date === item.date)).findIndex((i) => i.kind === 'test')
        const order = item.kind === 'session' && firstTest >= 0 ? firstTest - 0.5 : count
        next.push({ ...item, order })
        next = renumber(next, item.date)
      }
      return next
    }
    case 'update': {
      const before = state.find((i) => i.id === action.id)
      let next = state.map((i) => (i.id === action.id ? { ...i, ...action.patch } : i))
      if (before && action.patch.date && action.patch.date !== before.date) {
        next = next.map((i) => (i.id === action.id ? { ...i, order: 1e6 } : i))
        next = renumber(renumber(next, before.date), action.patch.date)
      }
      return next
    }
    case 'remove': {
      const ids = new Set(action.ids)
      const dates = new Set(state.filter((i) => ids.has(i.id)).map((i) => i.date))
      let next = state.filter((i) => !ids.has(i.id))
      for (const d of dates) next = renumber(next, d)
      return next
    }
    case 'move': {
      const item = state.find((i) => i.id === action.id)
      if (!item) return state
      const target = sortDay(state.filter((i) => i.date === action.date && i.id !== action.id))
      const index = Math.max(0, Math.min(action.index, target.length))
      target.splice(index, 0, { ...item, date: action.date })
      let next = state.map((i) => (i.id === action.id ? { ...i, date: action.date } : i))
      next = renumber(next, action.date, target)
      if (item.date !== action.date) next = renumber(next, item.date)
      return next
    }
    default:
      return state
  }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setDone': {
      const item = state.items.find((i) => i.id === action.id)
      if (!item || !!item.done === action.done) return state
      const items = state.items.map((i) => (i.id === action.id ? { ...i, done: action.done } : i))
      // Ticking a card off logs whatever part of its time isn't logged yet
      // (focus time already counts), on the day it was done, never in the
      // future. Un-ticking takes the ticked time back; real focus time stays.
      const already = state.log.filter((l) => l.itemId === item.id).reduce((a, l) => a + l.minutes, 0)
      const minutes = action.minutes ?? Math.max(0, item.minutes - already)
      const entry: LogEntry = {
        id: uid(),
        date: item.date < action.today ? item.date : action.today,
        subject: item.subject,
        minutes,
        itemId: item.id,
        source: action.minutes != null ? 'focus' : 'done',
      }
      const log = action.done
        ? minutes > 0
          ? [...state.log, entry]
          : state.log
        : state.log.filter((l) => !(l.itemId === item.id && l.source === 'done'))
      return { ...state, items, log }
    }
    case 'warmUp': {
      // A new day starts with a fresh allowance.
      const plays = state.warmUp.date === action.date ? state.warmUp.plays : 0
      if (plays >= WARM_UP_DAILY_LIMIT || action.xp <= 0) return state
      return { ...state, bonusXp: state.bonusXp + action.xp, warmUp: { date: action.date, plays: plays + 1 } }
    }
    case 'streakCheck': {
      const shields = resolveStreak(state.log, action.today, state.shields).shields
      const before = state.shields
      const same = shields.available === before.available && shields.milestones === before.milestones && shields.frozen.join() === before.frozen.join()
      return same ? state : { ...state, shields }
    }
    case 'chest': {
      // One chest a day: the date is the lock.
      if (action.xp <= 0 || state.chest?.date === action.date) return state
      return { ...state, bonusXp: state.bonusXp + action.xp, chest: { date: action.date, xp: action.xp } }
    }
    case 'logFocus':
      if (action.minutes <= 0) return state
      return {
        ...state,
        log: [...state.log, { id: uid(), date: action.date, subject: action.subject, minutes: action.minutes, itemId: action.itemId, source: 'focus' }],
      }
    case 'subject.save': {
      const exists = state.subjects.some((s) => s.id === action.subject.id)
      return {
        ...state,
        subjects: exists ? state.subjects.map((s) => (s.id === action.subject.id ? action.subject : s)) : [...state.subjects, action.subject],
      }
    }
    case 'subject.remove': {
      const gone = new Set(state.items.filter((i) => i.subject === action.id).map((i) => i.id))
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.id),
        items: itemsReducer(state.items, { type: 'remove', ids: [...gone] }),
      }
    }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'replace':
      return action.state
    default:
      return { ...state, items: itemsReducer(state.items, action) }
  }
}

export function sampleState(today: ISODate): State {
  return { items: seedItems(today), subjects: seedSubjects, log: seedLog(today), settings: defaultSettings, bonusXp: 0, warmUp: emptyWarmUp, chest: null, shields: noShields }
}

export function emptyState(subjects: Subject[] = seedSubjects, settings: Settings = defaultSettings): State {
  return { items: [], subjects, log: [], settings, bonusXp: 0, warmUp: emptyWarmUp, chest: null, shields: noShields }
}

/** Where an unreadable save is parked before a fresh plan takes its place. */
const UNREADABLE_KEY = `${KEY}:unreadable`

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    // Private mode or blocked storage: read as nothing.
    return null
  }
}

function parse(raw: string): Partial<State> | null {
  try {
    const parsed = JSON.parse(raw) as Partial<State>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** Fills a partial save (or an imported file) with defaults; null if it has no planner in it. */
export function normalizeState(parsed: Partial<State> | null | undefined): State | null {
  if (!parsed || !Array.isArray(parsed.items) || !Array.isArray(parsed.subjects)) return null
  const items = parsed.items.filter((i) => !!i && typeof i.id === 'string' && typeof i.date === 'string' && typeof i.title === 'string')
  const subjects = parsed.subjects.filter((s) => !!s && typeof s.id === 'string' && typeof s.name === 'string')
  return {
    items,
    subjects,
    log: Array.isArray(parsed.log) ? parsed.log : [],
    settings: { ...defaultSettings, ...parsed.settings },
    bonusXp: typeof parsed.bonusXp === 'number' ? parsed.bonusXp : 0,
    warmUp: parsed.warmUp ?? emptyWarmUp,
    chest: parsed.chest ?? null,
    shields: parsed.shields ?? noShields,
  }
}

function load(today: ISODate): State {
  const fresh = () => (seedForNewUsers ? sampleState(today) : emptyState())
  const raw = read(KEY)
  if (raw) {
    const saved = normalizeState(parse(raw))
    if (saved) return saved
    // A save we cannot read is parked, never replaced in place by a fresh plan.
    try {
      if (!read(UNREADABLE_KEY)) localStorage.setItem(UNREADABLE_KEY, raw)
    } catch {
      // Storage full or blocked: nothing to keep the copy with.
    }
    return fresh()
  }
  // Round-one saves only had cards; keep them and add the default subjects.
  const legacy = read(LEGACY_KEY)
  const old = legacy ? parse(legacy) : null
  return old && Array.isArray(old.items) ? { ...emptyState(), items: old.items } : fresh()
}

export function usePlanner(today: ISODate) {
  const [state, dispatch] = useReducer(reducer, today, load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked; the plan still works for this visit.
    }
  }, [state])
  return [state, dispatch] as const
}
