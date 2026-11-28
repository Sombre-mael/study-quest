import { Printer } from 'lucide-react'
import { useMemo, type CSSProperties } from 'react'

import { Button } from '../components/Button'
import type { Item, Settings } from '../data'
import { addDays, dayRange, longDayLabel, weekLabel, weekStart, type ISODate } from '../lib/dates'
import { navigate } from '../lib/router'
import { CalendarToolbar } from './CalendarToolbar'
import { DayColumn } from './DayColumn'
import { useDayDnd } from './dnd'
import type { CardActions } from './SessionCard'

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
  const { hotDay, onDragMove, onDrop } = useDayDnd(onMove)
  const byDay = useMemo(() => {
    const m = new Map<ISODate, Item[]>()
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it])
    for (const list of m.values()) list.sort((a, b) => a.order - b.order)
    return m
  }, [items])
  const go = (d: ISODate) => navigate(`/week?d=${d}`, { replace: true })

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
      <div className="edge-fade no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory scroll-px-4 items-start gap-3 overflow-x-auto px-4 pb-1 [&>*]:snap-start sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-(--board-pad) sm:pb-0 sm:[-webkit-mask-image:none] sm:[mask-image:none] sm:gap-(--col-gap) lg:grid-cols-4 xl:grid-cols-7">
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
      <p className="sr-only">Semaine du {longDayLabel(start)}</p>
    </section>
  )
}
