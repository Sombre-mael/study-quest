import { ArrowLeft, ChevronLeft, ChevronRight, Flag, Printer } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '../components/Button'
import { DateBadge } from '../components/DateBadge'
import { IconButton } from '../components/IconButton'
import { DurationPill, TestPill } from '../components/Pill'
import { SubjectChip } from '../components/SubjectChip'
import { copy, type Item } from '../data'
import { cx } from '../lib/cx'
import { addDays, dayRange, fromISO, weekLabel, weekStart, type ISODate } from '../lib/dates'
import { formatDuration, formatTotal } from '../lib/format'
import { countdown } from '../lib/insights'
import { navigate } from '../lib/router'
import { useSubjects } from '../lib/subjects'

/**
 * One week on a white sheet: seven columns, every card, the day totals and
 * the tests ahead. Sized to screenshot cleanly (16:10 at 1200 wide) and to
 * print on one landscape page.
 */
export function PrintWeek({ items, today, anchor }: { items: Item[]; today: ISODate; anchor: ISODate }) {
  const { get } = useSubjects()
  const start = weekStart(anchor)
  const days = dayRange(start, addDays(start, 6))
  const byDay = (d: ISODate) => items.filter((i) => i.date === d).sort((a, b) => a.order - b.order)
  const weekItems = items.filter((i) => i.date >= start && i.date <= days[6]!)
  const total = weekItems.reduce((a, i) => a + (i.kind === 'session' ? i.minutes : 0), 0)
  const subjectTotals = new Map<string, number>()
  for (const i of weekItems) if (i.kind === 'session') subjectTotals.set(i.subject, (subjectTotals.get(i.subject) ?? 0) + i.minutes)
  const tests = items.filter((i) => i.kind === 'test' && i.date >= start).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const go = (d: ISODate) => navigate(`/print?d=${d}`, { replace: true })

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center px-[clamp(16px,2.8vw,40px)] pb-12">
      <div className="no-print flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2 py-4">
        <Button variant="glass" size="sm" onClick={() => navigate(`/week?d=${start}`)}>
          <ArrowLeft />
          Back to week
        </Button>
        <div className="flex items-center gap-1">
          <IconButton tone="dark" label="Previous week" onClick={() => go(addDays(start, -7))}>
            <ChevronLeft />
          </IconButton>
          <span className="min-w-[120px] text-center text-[15px] font-semibold tabular-nums">{weekLabel(start)}</span>
          <IconButton tone="dark" label="Next week" onClick={() => go(addDays(start, 7))}>
            <ChevronRight />
          </IconButton>
        </div>
        <Button variant="pill" size="sm" onClick={() => window.print()} className="px-4">
          <Printer />
          Print or save PDF
        </Button>
      </div>

      <motion.article
        aria-label={`Study plan for the week of ${weekLabel(start)}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="on-light print-sheet w-full max-w-[1200px] rounded-dialog bg-white p-[clamp(16px,2.6vw,36px)] text-ink shadow-lift lg:aspect-[16/10] print:aspect-auto print:max-w-none print:rounded-none print:p-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.06em] text-teal-700 uppercase">{copy.brand}</p>
            <h1 className="mt-1 text-[clamp(24px,2.4vw,32px)] font-bold tracking-[-0.03em]">Week of {weekLabel(start)}</h1>
          </div>
          <dl className="flex gap-6 text-[13px]">
            <div>
              <dt className="text-ink-soft">Planned</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{formatTotal(total)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Sessions</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{weekItems.filter((i) => i.kind === 'session').length}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Tests</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{weekItems.filter((i) => i.kind === 'test').length}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-7 print:grid-cols-7">
          {days.map((d) => {
            const list = byDay(d)
            const sum = list.reduce((a, i) => a + (i.kind === 'session' ? i.minutes : 0), 0)
            return (
              <section key={d} className={cx('flex min-h-[120px] flex-col rounded-[2px] bg-[#f3f7f7] p-2.5 lg:min-h-[300px]', d === today && 'shadow-[inset_0_0_0_1.5px_var(--color-teal-700)]')}>
                <h2 className="flex items-baseline justify-between text-[13.5px]">
                  <span className="font-semibold">{fromISO(d).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  <span className="text-ink-soft tabular-nums">{fromISO(d).getDate()}</span>
                </h2>
                <ul className="mt-2 flex flex-1 flex-col gap-1.5">
                  {list.map((i) => (
                    <li key={i.id} className="rounded-[2px] bg-white p-2 shadow-[0_1px_2px_rgb(4_40_38/0.08)]">
                      <div className="flex items-center gap-1.5">
                        {i.kind === 'test' ? <DateBadge date={i.date} size={20} /> : <SubjectChip subject={i.subject} size={18} />}
                        <span className={cx('min-w-0 flex-1 text-[12.5px] leading-4 font-medium break-words', i.done && 'text-ink-soft line-through')}>{i.title}</span>
                      </div>
                      <div className="mt-1.5 origin-left scale-[0.86]">{i.kind === 'test' ? <TestPill /> : <DurationPill minutes={i.minutes} done={i.done} />}</div>
                    </li>
                  ))}
                  {list.length === 0 && <li className="text-[12.5px] text-ink-soft">{copy.emptyDay}</li>}
                </ul>
                <p className="mt-2 border-t border-line pt-1.5 text-[12.5px] text-ink-soft tabular-nums">{formatTotal(sum)}</p>
              </section>
            )
          })}
        </div>

        <footer className="mt-4 grid gap-4 border-t border-line pt-4 text-[13px] sm:grid-cols-2">
          <div>
            <h2 className="font-semibold">By subject</h2>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {[...subjectTotals.entries()].sort((a, b) => b[1] - a[1]).map(([id, m]) => (
                <li key={id} className="flex items-center gap-1.5">
                  <SubjectChip subject={id} size={14} />
                  {get(id).name} <span className="text-ink-soft tabular-nums">{formatDuration(m)}</span>
                </li>
              ))}
              {subjectTotals.size === 0 && <li className="text-ink-soft">Nothing planned this week</li>}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold">Tests ahead</h2>
            <ul className="mt-1.5 space-y-1">
              {tests.map((t) => (
                <li key={t.id} className="flex items-center gap-1.5">
                  <Flag size={13} className="text-flag-ink" aria-hidden />
                  {t.title} <span className="text-ink-soft">· {fromISO(t.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {countdown(t.date, today)}</span>
                </li>
              ))}
              {tests.length === 0 && <li className="text-ink-soft">None scheduled</li>}
            </ul>
          </div>
        </footer>
      </motion.article>
    </div>
  )
}
