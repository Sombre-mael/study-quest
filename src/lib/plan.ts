import { techniques, type Item } from '../data'
import { addDays, dayRange, diffDays, type ISODate } from './dates'
import { uid } from './format'

export type PlanInput = {
  subject: string
  subjectName: string
  title: string
  testDate: ISODate
  totalMinutes: number
  sessionMinutes: number
  today: ISODate
}

export type Plan = { test: Item; sessions: Item[]; days: ISODate[] }

function technique(i: number, n: number): string {
  if (n === 1) return techniques.last[1]!
  if (i === 0) return techniques.first[0]!
  if (i === n - 1) return techniques.last[1]!
  if (i === n - 2 && n > 3) return techniques.last[0]!
  return techniques.middle[(i - 1) % techniques.middle.length]!
}

/**
 * Spread sessions over the days from today up to the day before the test.
 * Sessions lean towards the test: the last one always lands the day before,
 * and when there are more sessions than days a day takes two.
 */
export function buildPlan(input: PlanInput): Plan {
  const { subject, testDate, totalMinutes, sessionMinutes, today } = input
  const name = input.subjectName
  const testId = uid()
  const test: Item = {
    id: testId,
    kind: 'test',
    subject,
    title: input.title.trim() || `Contrôle de ${name}`,
    minutes: 0,
    date: testDate,
    order: 0,
    target: totalMinutes,
  }
  const lastStudyDay = addDays(testDate, -1)
  const days = diffDays(lastStudyDay, today) >= 0 ? dayRange(today, lastStudyDay) : []
  if (days.length === 0) return { test, sessions: [], days }

  const n = Math.max(1, Math.round(totalMinutes / sessionMinutes))
  const sessions: Item[] = []
  for (let i = 0; i < n; i++) {
    const dayIndex = Math.min(days.length - 1, Math.ceil(((i + 1) * days.length) / n) - 1)
    sessions.push({
      id: uid(),
      kind: 'session',
      subject,
      title: `${name} – ${technique(i, n)}`,
      subtitle: `Séance ${i + 1} sur ${n}`,
      minutes: sessionMinutes,
      date: days[dayIndex]!,
      order: 0,
      testId,
    })
  }
  return { test, sessions, days }
}
