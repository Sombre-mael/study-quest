import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Code,
  Dna,
  Drama,
  Dumbbell,
  Feather,
  FlaskConical,
  Globe,
  Hourglass,
  Landmark,
  Languages,
  Leaf,
  Lightbulb,
  type LucideIcon,
  Microscope,
  Music,
  Palette,
  PenTool,
  Scale,
  Sigma,
  Telescope,
} from 'lucide-react'

import { addDays, type ISODate } from './lib/dates'

// Every string, subject, option and seed card in the app lives here. Start editing here.

export const copy = {
  brand: 'Study Quest',
  headline: 'Study Quest',
  subcopy: 'Turn revision into a quest: plan your sessions, earn XP, and take on every test like a boss.',
  cta: 'Start your quest',
  planTitle: 'Plan for a test',
  planIntro: 'Pick the subject and the test date. We spread study sessions across the days before it.',
  planConfirm: 'Add to planner',
  addSession: 'Add session',
  resetDemo: 'Reset to the sample plan',
  emptyDay: 'Nothing planned',
  onboardingTitle: 'Your planner is wide open',
  onboardingBody: 'Tell it when your next test is and it lays out the study sessions for you. Then focus, tick them off, and watch your progress add up.',
  statsTitle: 'Progress',
  statsIntro: 'How your studying is adding up.',
  questsTitle: 'Quest log',
  questsIntro: 'Level up, clear today\'s quests, collect badges and wear down the bosses before exam day.',
  subjectsTitle: 'Subjects',
  subjectsIntro: 'The colours and icons on every card. Rename, recolour or add your own.',
  styleguideTitle: 'Style guide',
}

/**
 * Brand-new visitors see the sample plan so the template looks alive. Set this
 * to false to open on the onboarding empty state instead.
 */
export const seedForNewUsers = true

/** Icons a subject can wear. Keys are stored, so add new ones at the end. */
export const subjectIcons = {
  flask: FlaskConical,
  calculator: Calculator,
  book: BookOpen,
  hourglass: Hourglass,
  leaf: Leaf,
  atom: Atom,
  languages: Languages,
  globe: Globe,
  music: Music,
  palette: Palette,
  dumbbell: Dumbbell,
  code: Code,
  brain: Brain,
  microscope: Microscope,
  landmark: Landmark,
  pen: PenTool,
  sigma: Sigma,
  dna: Dna,
  telescope: Telescope,
  feather: Feather,
  scale: Scale,
  lightbulb: Lightbulb,
  drama: Drama,
} satisfies Record<string, LucideIcon>

export type IconKey = keyof typeof subjectIcons

/** Chip colours a subject can wear, in picker order. */
export const subjectColors = [
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Ink', value: '#0a0a0a' },
  { name: 'Sun', value: '#fbbf24' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Pink', value: '#e11d74' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Teal', value: '#0b8078' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Stone', value: '#78716c' },
]

export type Subject = {
  id: string
  name: string
  /** Chip background. The glyph colour is worked out from it. */
  color: string
  icon: IconKey
}

export const seedSubjects: Subject[] = [
  { id: 'chemistry', name: 'Chemistry', color: '#7c3aed', icon: 'flask' },
  { id: 'maths', name: 'Maths', color: '#f97316', icon: 'calculator' },
  { id: 'english', name: 'English', color: '#0a0a0a', icon: 'book' },
  { id: 'history', name: 'History', color: '#fbbf24', icon: 'hourglass' },
  { id: 'biology', name: 'Biology', color: '#16a34a', icon: 'leaf' },
  { id: 'physics', name: 'Physics', color: '#2563eb', icon: 'atom' },
  { id: 'languages', name: 'Languages', color: '#e11d74', icon: 'languages' },
  { id: 'geography', name: 'Geography', color: '#0891b2', icon: 'globe' },
]

/** Shown when a card points at a subject that has since been deleted. */
export const missingSubject: Subject = { id: '?', name: 'No subject', color: '#94a3a2', icon: 'book' }

export type Item = {
  id: string
  kind: 'session' | 'test'
  subject: string
  title: string
  subtitle?: string
  /** Sessions only. Tests do not count towards a day's total. */
  minutes: number
  date: ISODate
  /** Position within the day. */
  order: number
  /** Sessions made by the planner point at their test. */
  testId?: string
  /** Tests only: how much study the test needs, for the readiness meter. */
  target?: number
  done?: boolean
}

/** One stretch of real study: a ticked-off session or time in the focus timer. */
export type LogEntry = {
  id: string
  date: ISODate
  subject: string
  minutes: number
  itemId?: string
  source: 'done' | 'focus'
}

export type Settings = {
  /** Most minutes a day should hold. 0 turns the limit off. */
  dailyLimit: number
  focusMinutes: number
  breakMinutes: number
}

export const defaultSettings: Settings = { dailyLimit: 120, focusMinutes: 25, breakMinutes: 5 }

export const dailyLimitOptions = [0, 60, 90, 120, 180, 240]
export const focusOptions = [15, 25, 45, 50]
export const breakOptions = [5, 10, 15]

/** Tests without a planned total aim for this much study. */
export const defaultTarget = 180
/** Study in the weeks before a test counts towards its readiness. */
export const readinessWindowDays = 21

/** Study techniques the planner cycles through, first session to last. */
export const techniques = {
  first: ['recap', 'notes read-through'],
  middle: ['flashcards', 'practice questions', 'key terms', 'mind map'],
  last: ['past paper', 'final review'],
}

export const durationOptions = [15, 20, 30, 45, 60, 90]
export const totalOptions = [60, 120, 180, 240, 300, 360]

/** The sample plan, laid out around today (the reference shows today as Wed 11). */
export function seedItems(today: ISODate): Item[] {
  const d = (n: number) => addDays(today, n)
  const testId = 'seed-chem-test'
  const rows: Array<Omit<Item, 'order'>> = [
    { id: 'seed-1', kind: 'session', subject: 'biology', title: 'Photosynthesis', subtitle: 'Calvin cycle', minutes: 40, date: d(-2) },
    { id: 'seed-2', kind: 'session', subject: 'languages', title: 'French vocab', subtitle: 'Unit 4 — travel', minutes: 20, date: d(-2) },
    { id: 'seed-3', kind: 'session', subject: 'chemistry', title: 'Chemistry equations', minutes: 30, date: d(-1), testId },
    { id: 'seed-4', kind: 'session', subject: 'maths', title: 'Maths past paper', subtitle: '2023 paper 2, timed', minutes: 60, date: d(0) },
    { id: 'seed-5', kind: 'session', subject: 'english', title: 'Flashcards', minutes: 20, date: d(0) },
    { id: 'seed-6', kind: 'session', subject: 'history', title: 'History essay plan', subtitle: 'Causes of WW1 — three points', minutes: 90, date: d(1) },
    { id: 'seed-7', kind: 'session', subject: 'biology', title: 'Biology recap', minutes: 45, date: d(2) },
    { id: testId, kind: 'test', subject: 'chemistry', title: 'Chemistry test', minutes: 0, date: d(2), target: 150 },
    { id: 'seed-8', kind: 'session', subject: 'physics', title: 'Forces worksheet', subtitle: 'Questions 1–12', minutes: 30, date: d(3) },
    { id: 'seed-9', kind: 'session', subject: 'geography', title: 'Rivers case study', minutes: 25, date: d(4) },
    { id: 'seed-10', kind: 'session', subject: 'maths', title: 'Maths flashcards', subtitle: 'Trig identities', minutes: 20, date: d(5) },
    { id: 'seed-11', kind: 'test', subject: 'maths', title: 'Maths test', minutes: 0, date: d(6), target: 240 },
    { id: 'seed-12', kind: 'session', subject: 'history', title: 'Source analysis', subtitle: 'Propaganda posters', minutes: 45, date: d(8) },
    { id: 'seed-13', kind: 'test', subject: 'history', title: 'History mock', minutes: 0, date: d(12), target: 240 },
  ]
  const perDay = new Map<string, number>()
  return rows.map((r) => {
    const order = perDay.get(r.date) ?? 0
    perDay.set(r.date, order + 1)
    return { ...r, order }
  })
}

/**
 * Study already done before today, so the progress page has a streak and a
 * chart on the first visit. It is history only: no cards on the board.
 */
export function seedLog(today: ISODate): LogEntry[] {
  const rows: Array<[number, string, number]> = [
    [-1, 'chemistry', 35], [-1, 'maths', 25],
    [-2, 'biology', 40], [-2, 'languages', 20],
    [-3, 'chemistry', 30], [-3, 'history', 45],
    [-4, 'maths', 50],
    [-5, 'english', 30], [-5, 'chemistry', 25],
    [-6, 'physics', 30],
    [-7, 'maths', 25], [-7, 'history', 30],
    [-9, 'biology', 30], [-11, 'maths', 40], [-12, 'chemistry', 20], [-15, 'geography', 25],
  ]
  return rows.map(([n, subject, minutes], i) => ({ id: `seed-log-${i}`, date: addDays(today, n), subject, minutes, source: 'focus' }))
}
