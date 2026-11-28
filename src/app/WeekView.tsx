import { Printer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { Button } from '../components/Button'
import type { Item, Settings } from '../data'
import { cx } from '../lib/cx'
import { addDays, dayRange, longDayLabel, weekLabel, weekStart, type ISODate } from '../lib/dates'
import { navigate } from '../lib/router'
import { CalendarToolbar } from './CalendarToolbar'
import { DayColumn } from './DayColumn'
import { useDayDnd } from './dnd'
import type { CardActions } from './SessionCard'

/** Distance between two day columns, measured once they are laid out. */
function columnStep(el: HTMLElement): number {
  const columns = [...el.querySelectorAll<HTMLElement>('[data-day]')]
  return columns.length > 1 ? columns[1]!.offsetLeft - columns[0]!.offsetLeft : el.clientWidth
}

/** Monday to Sunday, every day visible at once. Cards drag between days. */
export function WeekView({
  items,
  today,
  anchor,
  settings,
  actions,
  onAdd,
  onMove,
}: {
  items: Item[]
  today: ISODate
  anchor: ISODate
  settings: Settings
  actions: CardActions
  onAdd: (date: ISODate) => void
  onMove: (id: string, date: ISODate, index: number) => void
}) {
  const start = weekStart(anchor)
  const days = dayRange(start, addDays(start, 6))
  const strip = useRef<HTMLDivElement>(null)
  /** Which day the phone strip is showing, for the dots under it. */
  const [shown, setShown] = useState(0)
  const { hotDay, onDragMove, onDrop } = useDayDnd(onMove)
  const byDay = useMemo(() => {
    const m = new Map<ISODate, Item[]>()
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it])
    for (const list of m.values()) list.sort((a, b) => a.order - b.order)
    return m
  }, [items])
  const go = (d: ISODate) => navigate(`/week?d=${d}`, { replace: true })

  // On phones the week is a swipeable strip: a dot follows the day in view, so
  // the week stays readable when the card header has scrolled past.
  useEffect(() => {
    const el = strip.current
    if (!el) return
    const sync = () => {
      const step = Math.max(1, columnStep(el))
      const next = Math.max(0, Math.min(days.length - 1, Math.round(el.scrollLeft / step)))
      setShown((current) => (current === next ? current : next))
    }
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [days.length])

  const showDay = (index: number) => {
    const el = strip.current
    if (!el) return
    el.scrollTo({ left: index * columnStep(el), behavior: 'smooth' })
  }

  return (
    <section aria-label="Vue semaine" className="flex flex-1 flex-col pb-[13px]" style={{ '--board-pad': 'clamp(16px, 2.8vw, 40px)' } as CSSProperties}>
      <CalendarToolbar
        unit="week"
        label={weekLabel(start)}
        onPrev={() => go(addDays(start, -7))}
        onNext={() => go(addDays(start, 7))}
        onToday={() => go(today)}
        isCurrent={start === weekStart(today)}
        extra={
          <Button variant="glass" size="sm" onClick={() => navigate(`/print?d=${start}`)} className="max-sm:hidden">
            <Printer />
            Imprimer la semaine
          </Button>
        }
      />
      {/* Phones scroll the week one day at a time, like the planning's date
          strip: snap per day, fades at both edges, no scrollbar. From `sm` up
          the same columns become the usual grid. */}
      <div
        ref={strip}
        className="edge-fade no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory scroll-px-4 items-start gap-3 overflow-x-auto px-4 pb-1 [&>*]:snap-start sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-(--board-pad) sm:pb-0 sm:[-webkit-mask-image:none] sm:[mask-image:none] sm:gap-(--col-gap) lg:grid-cols-4 xl:grid-cols-7">
        {days.map((date, i) => (
          <DayColumn
            key={date}
            fluid
            date={date}
            index={i}
            isToday={date === today}
            isPast={date < today}
            items={byDay.get(date) ?? []}
            limit={settings.dailyLimit}
            hot={hotDay === date}
            actions={actions}
            onAdd={onAdd}
            onDragMove={onDragMove}
            onDrop={onDrop}
          />
        ))}
      </div>
      {/* Phone pagination: a small square per day, the one in view in gold.
          Tapping one jumps to that day. Hidden once the grid takes over. */}
      <div className="mt-1 flex items-center justify-center sm:hidden">
        {days.map((date, i) => (
          <button
            key={date}
            type="button"
            onClick={() => showDay(i)}
            aria-label={`Afficher ${longDayLabel(date)}`}
            aria-current={i === shown ? 'true' : undefined}
            className="grid size-8 place-items-center"
          >
            <span
              className={cx(
                'block h-[6px] transition-all duration-150',
                i === shown ? 'w-5 bg-[#ffd166]' : 'w-[6px] bg-white/40',
              )}
            />
          </button>
        ))}
      </div>
      <p className="sr-only">Semaine du {longDayLabel(start)}</p>
    </section>
  )
}
