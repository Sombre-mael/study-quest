import { Flag } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, type CSSProperties } from 'react'

import { OverPill } from '../components/Pill'
import { SubjectChip } from '../components/SubjectChip'
import type { Item, Settings } from '../data'
import { cx } from '../lib/cx'
import { addDays, addMonths, dayOfMonth, dayRange, longDayLabel, monthLabel, monthStart, weekStart, type ISODate } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { navigate } from '../lib/router'
import { CalendarToolbar } from './CalendarToolbar'

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** The month at a glance. Each day opens on the board. */
export function MonthView({ items, today, anchor, settings }: { items: Item[]; today: ISODate; anchor: ISODate; settings: Settings }) {
  const first = monthStart(anchor)
  const next = addMonths(first, 1)
  const gridStart = weekStart(first)
  const gridEnd = addDays(weekStart(addDays(next, -1)), 6)
  const days = dayRange(gridStart, gridEnd)
  const byDay = useMemo(() => {
    const m = new Map<ISODate, Item[]>()
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it])
    for (const list of m.values()) list.sort((a, b) => (a.kind === b.kind ? a.order - b.order : a.kind === 'test' ? -1 : 1))
    return m
  }, [items])
  const go = (d: ISODate) => navigate(`/month?d=${d}`, { replace: true })

  return (
    <section aria-label="Month view" className="flex flex-1 flex-col pb-[13px]" style={{ '--board-pad': 'clamp(16px, 2.8vw, 40px)' } as CSSProperties}>
      <CalendarToolbar
        unit="month"
        label={monthLabel(first)}
        onPrev={() => go(addMonths(first, -1))}
        onNext={() => go(next)}
        onToday={() => go(today)}
        isCurrent={first === monthStart(today)}
      />
      <div className="px-(--board-pad)">
        <div className="grid grid-cols-7 gap-1 pb-1.5 text-center text-[12.5px] font-medium text-white/85 sm:gap-(--col-gap)" aria-hidden>
          {weekdays.map((d) => (
            <span key={d}>
              <span className="sm:hidden">{d[0]}</span>
              <span className="max-sm:hidden">{d}</span>
            </span>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1 sm:gap-(--col-gap)">
          {days.map((date, i) => {
            const list = byDay.get(date) ?? []
            const total = list.reduce((a, it) => a + (it.kind === 'session' ? it.minutes : 0), 0)
            const over = settings.dailyLimit && date >= today ? Math.max(0, total - settings.dailyLimit) : 0
            const inMonth = date >= first && date < next
            const isToday = date === today
            const tests = list.filter((x) => x.kind === 'test')
            const summary = [
              longDayLabel(date),
              isToday ? 'today' : '',
              list.length ? `${list.length} ${list.length === 1 ? 'item' : 'items'}` : 'nothing planned',
              total ? formatDuration(total) : '',
              tests.length ? tests.map((t) => t.title).join(', ') : '',
              over ? `${formatDuration(over)} over the daily limit` : '',
            ]
              .filter(Boolean)
              .join(', ')
            return (
              <motion.li
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, delay: Math.min(i, 34) * 0.008 }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/?d=${date}`)}
                  aria-label={`${summary}. Open on the board`}
                  className={cx(
                    'flex h-full min-h-[64px] w-full flex-col rounded-[2px] p-1.5 text-left transition-colors sm:min-h-[118px] sm:rounded-[2px] sm:p-2.5',
                    inMonth ? 'bg-column hover:bg-column-hot' : 'bg-white/[0.06] hover:bg-white/12',
                    over
                      ? 'shadow-[inset_0_0_0_1.5px_rgb(255_214_160/0.75)]'
                      : isToday
                        ? 'shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.7)]'
                        : 'shadow-[inset_0_0_0_1px_var(--color-column-edge)]',
                  )}
                >
                  <span className={cx('flex items-center gap-1.5 text-[13px] leading-5 sm:text-[14px]', inMonth ? 'text-white' : 'text-white/75', isToday && 'font-semibold')}>
                    {isToday && <span className="size-[6px] animate-pulse-dot rounded-[2px] bg-today" aria-hidden />}
                    {dayOfMonth(date)}
                  </span>
                  {/* Phones: a dot per card. */}
                  <span className="mt-1 flex flex-wrap gap-[3px] sm:hidden" aria-hidden>
                    {list.slice(0, 6).map((it) =>
                      it.kind === 'test' ? (
                        <Flag key={it.id} size={9} className="text-[#ffd7a8]" strokeWidth={3} />
                      ) : (
                        <span key={it.id} className={cx('size-[7px] rounded-[2px] bg-white', it.done && 'opacity-50')} />
                      ),
                    )}
                  </span>
                  {/* Wider screens: the first few cards by name. */}
                  <span className="mt-1.5 hidden min-w-0 flex-col gap-1 sm:flex" aria-hidden>
                    {list.slice(0, 3).map((it) => (
                      <span
                        key={it.id}
                        className={cx(
                          'flex min-w-0 items-center gap-1.5 rounded-[2px] px-1.5 py-[3px] text-[12px] leading-4',
                          it.kind === 'test' ? 'bg-flag text-flag-ink' : 'bg-white text-ink',
                          it.done && 'opacity-60',
                        )}
                      >
                        {it.kind === 'test' ? <Flag size={11} strokeWidth={2.4} className="shrink-0" /> : <SubjectChip subject={it.subject} size={14} />}
                        <span className={cx('truncate', it.done && 'line-through')}>{it.title}</span>
                      </span>
                    ))}
                    {list.length > 3 && <span className="px-1 text-[12px] text-white/85">+{list.length - 3} more</span>}
                  </span>
                  <span className="mt-auto hidden items-center justify-between gap-1 pt-1.5 text-[12px] text-white/85 tabular-nums sm:flex" aria-hidden>
                    {total ? formatDuration(total) : ''}
                    {over > 0 && (
                      <span className="max-lg:hidden">
                        <OverPill minutes={over} />
                      </span>
                    )}
                  </span>
                </button>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
