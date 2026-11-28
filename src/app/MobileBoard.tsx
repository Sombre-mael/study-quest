import { Plus, Shuffle } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../components/Button'
import { OverPill } from '../components/Pill'
import { copy, type Item, type Settings } from '../data'
import { cx } from '../lib/cx'
import { addDays, dayOfMonth, dayRange, fromISO, longDayLabel, type ISODate } from '../lib/dates'
import { formatTotal } from '../lib/format'
import { SessionCard, type CardActions } from './SessionCard'

function shortWeekday(iso: ISODate): string {
  return fromISO(iso).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
}

/**
 * Phones get one day at a time: a date strip to move between days and the
 * chosen day's cards stacked full width. The board's fixed-width columns and
 * long-press drag only make sense with a pointer, so they stay on wide screens.
 */
export function MobileBoard({
  items,
  today,
  settings,
  actions,
  onAdd,
  focusDate,
  scrollTarget,
}: {
  items: Item[]
  today: ISODate
  settings: Settings
  actions: CardActions
  onAdd: (date: ISODate) => void
  focusDate?: ISODate | null
  scrollTarget: { date: ISODate; n: number } | null
}) {
  const [selected, setSelected] = useState<ISODate>(focusDate ?? today)
  const strip = useRef<HTMLDivElement>(null)

  // Opening a day from the month view, or planning a test, selects its date.
  useEffect(() => {
    if (focusDate) setSelected(focusDate)
  }, [focusDate])
  useEffect(() => {
    if (scrollTarget) setSelected(scrollTarget.date)
  }, [scrollTarget])

  const days = useMemo(() => {
    const dates = [...items.map((i) => i.date), selected, today].sort()
    return dayRange(addDays(dates[0]!, -1), addDays(dates[dates.length - 1]!, 1))
  }, [items, selected, today])

  // Keep the chosen chip in the middle of the strip.
  useEffect(() => {
    const el = strip.current
    const chip = el?.querySelector<HTMLElement>(`[data-chip="${selected}"]`)
    if (!el || !chip) return
    el.scrollTo({ left: chip.offsetLeft - el.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [selected])

  const dayItems = useMemo(
    () => items.filter((i) => i.date === selected).sort((a, b) => a.order - b.order),
    [items, selected],
  )
  const total = dayItems.reduce((sum, i) => sum + (i.kind === 'session' ? i.minutes : 0), 0)
  const over = settings.dailyLimit && selected >= today ? Math.max(0, total - settings.dailyLimit) : 0

  return (
    <section aria-label="Jours d’étude" className="flex flex-1 flex-col gap-3 px-4 pb-6">
      <div
        ref={strip}
        role="group"
        aria-label="Choisir un jour"
        className="no-scrollbar edge-fade -mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pt-1 pb-2"
      >
        {days.map((date) => {
          const list = items.filter((i) => i.date === date)
          const active = date === selected
          return (
            <button
              key={date}
              type="button"
              data-chip={date}
              onClick={() => setSelected(date)}
              aria-pressed={active}
              aria-label={`${longDayLabel(date)}${date === today ? ', aujourd’hui' : ''}, ${list.length} ${list.length === 1 ? 'élément' : 'éléments'}`}
              className={cx(
                'relative flex w-[52px] shrink-0 snap-start flex-col items-center gap-1 rounded-[2px] pt-2 pb-1.5 transition-colors',
                active
                  ? 'bg-card text-ink shadow-card'
                  : date === today
                    ? 'bg-white/16 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)] hover:bg-white/24'
                    : 'text-white/85 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)] hover:bg-white/12 hover:text-white',
              )}
            >
              <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase">{shortWeekday(date)}</span>
              <span className="font-display text-[15px] leading-none">{dayOfMonth(date)}</span>
              <span className="flex h-[6px] items-center gap-[3px]" aria-hidden>
                {list.slice(0, 4).map((it) =>
                  it.kind === 'test' ? (
                    <span key={it.id} className="size-[5px] bg-[#e08a2e]" />
                  ) : (
                    <span key={it.id} className={cx('size-[5px]', active ? 'bg-teal-700/70' : 'bg-white/70')} />
                  ),
                )}
              </span>
            </button>
          )
        })}
      </div>

      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] leading-tight font-semibold tracking-[-0.01em]">
            {selected === today ? 'Aujourd’hui' : longDayLabel(selected)}
          </h2>
          <p className="mt-0.5 text-[13.5px] text-white/85">
            {selected === today && <span className="text-white/85">{longDayLabel(selected)} · </span>}
            {dayItems.length === 0 ? 'Rien de prévu' : `${formatTotal(total)} prévues`}
          </p>
        </div>
        {selected !== today && (
          <Button variant="linkDark" size="sm" onClick={() => setSelected(today)} className="pb-0.5">
            Aujourd’hui
          </Button>
        )}
      </header>

      {dayItems.length === 0 ? (
        <p className="rounded-column bg-column px-4 py-6 text-center text-[14px] leading-[1.5] text-white/85 shadow-[inset_0_0_0_1px_var(--color-column-edge)]">
          Une journée libre. Ajoute une séance ou choisis une autre date ci-dessus.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {dayItems.map((item, i) => (
              <SessionCard
                key={item.id}
                item={item}
                delay={i * 0.04}
                draggable={false}
                actions={actions}
                onDragMove={() => {}}
                onDrop={() => false}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {over > 0 && (
          <div className="flex">
            <OverPill minutes={over} />
          </div>
        )}
        <Button variant="glass" size="md" className="w-full max-sm:h-11" onClick={() => onAdd(selected)}>
          <Plus />
          {copy.addSession}
        </Button>
        {over > 0 && (
          <Button variant="glass" size="md" className="w-full" onClick={() => actions.rebalance(selected)}>
            <Shuffle />
            Rééquilibrer ce jour
          </Button>
        )}
      </div>
    </section>
  )
}
