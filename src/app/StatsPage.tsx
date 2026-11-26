import { CalendarCheck, ChartColumn, Clock, Flag, Flame, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'

import { Button } from '../components/Button'
import { BarChart, DayBars } from '../components/Charts'
import { DateBadge } from '../components/DateBadge'
import { EmptyState } from '../components/EmptyState'
import { Segmented } from '../components/Field'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { StatTile } from '../components/StatTile'
import { SubjectChip } from '../components/SubjectChip'
import { ReadinessMeter } from '../components/ReadinessMeter'
import { copy, type Item, type LogEntry, type Settings } from '../data'
import { cx } from '../lib/cx'
import { addDays, dayLabel, dayRange, diffDays, fromISO, longDayLabel, type ISODate } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { countdown, minutesBySubject, minutesOn, readiness, streak } from '../lib/insights'
import { navigate } from '../lib/router'
import { useSubjects } from '../lib/subjects'
import { PageShell } from './PageShell'

type Range = 'Week' | '30 days' | 'All time'
const ranges: Range[] = ['Week', '30 days', 'All time']

/** Hours per subject, the streak, and a countdown to every test with how ready you are. */
export function StatsPage({
  items,
  log,
  settings,
  today,
  onPlan,
}: {
  items: Item[]
  log: LogEntry[]
  settings: Settings
  today: ISODate
  onPlan: () => void
}) {
  const { get } = useSubjects()
  const [range, setRange] = useState<Range>('Week')
  const from = range === 'Week' ? addDays(today, -6) : range === '30 days' ? addDays(today, -29) : null

  const bySubject = useMemo(() => minutesBySubject(log, from, today), [log, from, today])
  const total = [...bySubject.values()].reduce((a, b) => a + b, 0)
  const doneIds = new Set(log.filter((l) => l.itemId && (!from || l.date >= from) && l.date <= today).map((l) => l.itemId))
  const doneCount = items.filter((i) => i.done && doneIds.has(i.id)).length
  const s = streak(log, today)
  const tests = items.filter((i) => i.kind === 'test' && i.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const next = tests[0]

  const bars = [...bySubject.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, minutes]) => {
      const subj = get(id)
      return { id, label: subj.name, value: minutes, color: subj.color, lead: <SubjectChip subject={subj} size={20} /> }
    })

  const days = dayRange(addDays(today, -13), today).map((d) => ({
    date: d,
    label: longDayLabel(d),
    short: fromISO(d).toLocaleDateString('en-GB', { weekday: 'narrow' }),
    value: minutesOn(log, d),
    today: d === today,
  }))
  const fortnight = days.reduce((a, d) => a + d.value, 0)
  const last14 = dayRange(addDays(today, -13), today)
  const studiedDays = new Set(log.map((l) => l.date))

  return (
    <PageShell>
      <PageHeader
        title={copy.statsTitle}
        intro={copy.statsIntro}
        actions={<Segmented name="Time range" tone="glass" value={range} options={ranges} onChange={setRange} className="min-w-[280px]" />}
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile label="Studied" icon={<Clock />} value={total ? formatDuration(total) : '0 min'} caption={range === 'All time' ? 'Since you started' : `In the last ${range === 'Week' ? '7' : '30'} days`} />
        <StatTile
          label="Streak"
          icon={<Flame />}
          delay={0.05}
          value={`${s.days} ${s.days === 1 ? 'day' : 'days'}`}
          caption={s.days === 0 ? 'Study today to start one' : s.studiedToday ? 'Including today' : 'Study today to keep it'}
        >
          <div className="flex gap-[3px]" role="img" aria-label={`Studied on ${last14.filter((d) => studiedDays.has(d)).length} of the last 14 days`}>
            {last14.map((d) => (
              <span key={d} title={dayLabel(d)} className={cx('h-2 flex-1 rounded-[2px]', studiedDays.has(d) ? 'bg-teal-700' : 'bg-[#e3eaea]', d === today && 'ring-2 ring-teal-700/25')} />
            ))}
          </div>
        </StatTile>
        <StatTile label="Sessions done" icon={<CalendarCheck />} delay={0.1} value={doneCount} caption={range === 'All time' ? 'Ticked off so far' : 'Ticked off in this range'} />
        <StatTile
          label="Next test"
          icon={<Flag />}
          delay={0.15}
          value={next ? (diffDays(next.date, today) === 0 ? 'Today' : `${diffDays(next.date, today)} ${diffDays(next.date, today) === 1 ? 'day' : 'days'}`) : '—'}
          caption={next ? `${next.title}, ${dayLabel(next.date)}` : 'No tests planned'}
        />
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.15fr_1fr]">
        <Panel title="Hours per subject" action={<span className="text-[13px] text-ink-soft tabular-nums">{formatDuration(total || 0)} total</span>}>
          {bars.length ? (
            <BarChart data={bars} format={formatDuration} label={`Minutes studied per subject, ${range.toLowerCase()}`} />
          ) : (
            <EmptyState icon={<ChartColumn />} title="No study logged in this range" body="Finish a focus session or tick a card off and it shows up here." />
          )}
        </Panel>

        <Panel title="Upcoming tests" action={<Button variant="secondary" size="sm" onClick={onPlan}><Sparkles />Plan a test</Button>}>
          {tests.length ? (
            <ul className="divide-y divide-line">
              {tests.map((t, i) => {
                const r = readiness(t, items, log, today)
                return (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34, delay: 0.05 * i }}
                    className="relative py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <DateBadge date={t.date} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">
                          <button
                            type="button"
                            onClick={() => navigate(`/?d=${t.date}`)}
                            aria-label={`${t.title}, open on the board`}
                            className="text-left after:absolute after:inset-0 after:rounded-[2px] after:content-[''] hover:underline"
                          >
                            {t.title}
                          </button>
                        </p>
                        <p className="text-[13px] text-ink-soft">
                          {countdown(t.date, today)} · {formatDuration(r.studied)} of {formatDuration(r.target)} studied
                        </p>
                      </div>
                      <SubjectChip subject={t.subject} size={22} />
                    </div>
                    <div className="mt-2.5">
                      <ReadinessMeter value={r} />
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          ) : (
            <EmptyState icon={<Flag />} title="No tests coming up" body="Add a test and the planner spreads sessions before it." actions={<Button onClick={onPlan}>Plan a test</Button>} />
          )}
        </Panel>
      </div>

      <Panel title="Last 14 days" className="mt-3.5" action={<span className="text-[13px] text-ink-soft tabular-nums">{formatDuration(fortnight || 0)}</span>}>
        <DayBars
          data={days}
          limit={settings.dailyLimit}
          format={formatDuration}
          label={`Minutes studied per day over the last 14 days: ${days.map((d) => `${dayLabel(d.date)} ${d.value}`).join(', ')}`}
        />
      </Panel>
    </PageShell>
  )
}
