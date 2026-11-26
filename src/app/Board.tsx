import { useCallback, useLayoutEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'

import type { Item, Settings } from '../data'
import { addDays, dayRange, type ISODate } from '../lib/dates'
import { useDayDnd } from './dnd'
import { DayColumn } from './DayColumn'
import type { CardActions } from './SessionCard'

export function Board({
  items,
  today,
  actions,
  onAdd,
  onMove,
  scrollTarget,
  focusDate,
  settings,
}: {
  items: Item[]
  settings: Settings
  /** Open with this day in view (from ?d= in the URL). */
  focusDate?: ISODate | null
  today: ISODate
  actions: CardActions
  onAdd: (date: ISODate) => void
  onMove: (id: string, date: ISODate, index: number) => void
  /** Bump to scroll a day into view (e.g. after planning a test). */
  scrollTarget: { date: ISODate; n: number } | null
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const { hotDay, onDragMove, onDrop } = useDayDnd(onMove, scroller)

  const days = useMemo(() => {
    const dates = items.map((i) => i.date).sort()
    if (focusDate) dates.push(focusDate)
    dates.sort()
    const earliest = dates[0] && dates[0] < addDays(today, -2) ? dates[0] : addDays(today, -2)
    const floor = focusDate && focusDate < addDays(today, -7) ? addDays(focusDate, -2) : addDays(today, -7)
    const from = earliest < floor ? floor : earliest
    const latest = dates[dates.length - 1]
    const to = latest && latest > addDays(today, 10) ? addDays(latest, 2) : addDays(today, 12)
    return dayRange(from, to)
  }, [items, today, focusDate])

  const byDay = useMemo(() => {
    const m = new Map<ISODate, Item[]>()
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it])
    for (const list of m.values()) list.sort((a, b) => a.order - b.order)
    return m
  }, [items])

  const scrollToDay = useCallback((date: ISODate, smooth: boolean) => {
    const el = scroller.current
    const col = el?.querySelector<HTMLElement>(`[data-day="${date}"]`)
    if (!el || !col) return
    const pad = parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0
    el.scrollTo({ left: col.offsetLeft - pad, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // Open on yesterday so today sits second, as in the reference; phones open on today.
  useLayoutEffect(() => {
    const anchor = focusDate ?? today
    scrollToDay(window.innerWidth < 768 ? anchor : addDays(anchor, -1), false)
  }, [scrollToDay, today, focusDate])

  useLayoutEffect(() => {
    if (scrollTarget) scrollToDay(addDays(scrollTarget.date, window.innerWidth < 768 ? 0 : -2), true)
  }, [scrollTarget, scrollToDay])

  // Mouse users can grab the row's background and drag it sideways.
  const pan = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-card], button')) return
    pan.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = pan.current
    if (!p) return
    const dx = e.clientX - p.x
    if (!p.moved && Math.abs(dx) < 4) return
    if (!p.moved) {
      p.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      e.currentTarget.dataset.panning = 'true'
    }
    e.currentTarget.scrollLeft = p.left - dx
  }
  const endPan = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pan.current) return
    pan.current = null
    const el = e.currentTarget
    // Re-enabling snap lets the browser settle on the nearest column.
    const left = el.scrollLeft
    delete el.dataset.panning
    el.scrollLeft = left
  }

  return (
    <div
      ref={scroller}
      role="region"
      aria-label="Study days"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      className="board-scroller relative flex flex-1 gap-(--col-gap) overflow-x-auto overflow-y-hidden px-(--board-pad) pb-[13px]"
    >
      {days.map((date, i) => (
        <DayColumn
          key={date}
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
  )
}
