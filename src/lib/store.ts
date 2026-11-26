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
import { emptyWarmUp, WARM_UP_DAILY_LIMIT, type WarmUp } from './game'

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
  return { items: seedItems(today), subjects: seedSubjects, log: seedLog(today), settings: defaultSettings, bonusXp: 0, warmUp: emptyWarmUp }
}

export function emptyState(subjects: Subject[] = seedSubjects, settings: Settings = defaultSettings): State {
  return { items: [], subjects, log: [], settings, bonusXp: 0, warmUp: emptyWarmUp }
}

function load(today: ISODate): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>
      if (Array.isArray(parsed.items) && Array.isArray(parsed.subjects)) {
        return {
          items: parsed.items,
          subjects: parsed.subjects,
          log: Array.isArray(parsed.log) ? parsed.log : [],
          settings: { ...defaultSettings, ...parsed.settings },
          bonusXp: typeof parsed.bonusXp === 'number' ? parsed.bonusXp : 0,
          warmUp: parsed.warmUp ?? emptyWarmUp,
        }
      }
    }
    // Round-one saves only had cards; keep them and add the default subjects.
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as { items?: Item[] }
      if (Array.isArray(parsed.items)) return { ...emptyState(), items: parsed.items }
    }
  } catch {
    // Private mode or corrupt data: fall back to a fresh start.
  }
  return seedForNewUsers ? sampleState(today) : emptyState()
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
