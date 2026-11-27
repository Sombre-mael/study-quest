import { Plus, Shuffle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import { Button } from '../components/Button'
import { OverPill } from '../components/Pill'
import { copy, type Item } from '../data'
import { cx } from '../lib/cx'
import { dayLabel, longDayLabel, type ISODate } from '../lib/dates'
import { formatTotal } from '../lib/format'
import type { Point } from './dnd'
import { entrance, spring } from './motion'
import { SessionCard, type CardActions } from './SessionCard'

export function DayColumn({
  date,
  index,
  isToday,
  isPast,
  items,
  limit,
  hot,
  actions,
  onAdd,
  onDragMove,
  onDrop,
  fluid = false,
  label,
}: {
  date: ISODate
  index: number
  isToday: boolean
  isPast: boolean
  items: Item[]
  /** Daily limit in minutes; 0 means no limit. */
  limit: number
  hot: boolean
  actions: CardActions
  onAdd: (date: ISODate) => void
  onDragMove: (p: Point | null) => void
  onDrop: (item: Item, p: Point) => boolean
  /** Fill the grid cell (week view) instead of the board's fixed width. */
  fluid?: boolean
  /** Header text; defaults to "Tue 10". */
  label?: string
}) {
  const total = items.reduce((sum, i) => sum + (i.kind === 'session' ? i.minutes : 0), 0)
  const over = limit > 0 && !isPast ? Math.max(0, total - limit) : 0
  const columnDelay = Math.min(index, 8) * 0.06

  return (
    <motion.section
      data-day={date}
      data-over={over > 0 || undefined}
      aria-label={`${longDayLabel(date)}${isToday ? ', aujourd’hui' : ''}${over ? `, ${over} minutes au-dessus de la limite quotidienne` : ''}`}
      initial={entrance.active ? { opacity: 0, y: 34 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: entrance.active ? 0.35 + columnDelay : 0 }}
      className={cx(
        'group/col relative flex shrink-0 flex-col rounded-column pt-[13px] transition-[background-color,box-shadow] duration-200',
        fluid ? 'min-h-[128px] w-full min-w-0 px-[11px] sm:min-h-[220px]' : 'w-(--col-w) snap-start px-[15px]',
        hot
          ? 'bg-column-hot shadow-[inset_0_0_0_2px_rgb(255_255_255/0.65),4px_4px_0_rgb(2_22_20/0.3)]'
          : over
            ? 'bg-column shadow-[inset_0_0_0_2px_rgb(255_214_160/0.85),4px_4px_0_rgb(2_22_20/0.3)]'
            : 'bg-column shadow-[inset_0_0_0_2px_var(--color-column-edge),4px_4px_0_rgb(2_22_20/0.3)]',
      )}
    >
      <header className="flex h-[22px] items-center gap-[7px] text-[15px] leading-none">
        {isToday && <span className="size-[6px] animate-pulse-dot rounded-[2px] bg-today" aria-hidden />}
        <h2 className={cx('text-white', isToday && 'font-semibold')}>{label ?? dayLabel(date)}</h2>
      </header>

      <div className="mt-[9px] flex min-h-0 flex-1 flex-col gap-[10px]">
        <AnimatePresence initial={entrance.active} mode="popLayout">
          {items.map((item, i) => (
            <SessionCard
              key={item.id}
              item={item}
              compact={fluid}
              delay={0.5 + columnDelay + i * 0.06}
              actions={actions}
              onDragMove={onDragMove}
              onDrop={onDrop}
            />
          ))}
        </AnimatePresence>
        <motion.button
          layout="position"
          transition={spring}
          type="button"
          onClick={() => onAdd(date)}
          aria-label={`${copy.addSession} le ${longDayLabel(date)}`}
          className="flex h-9 items-center gap-1.5 rounded-[2px] px-2 text-[13.5px] font-medium text-white/0 transition-colors group-hover/col:text-white/85 hover:bg-white/10 hover:text-white focus-visible:text-white max-sm:h-10 [@media(hover:none)]:text-white/80"
        >
          <Plus size={15} strokeWidth={2.2} aria-hidden />
          {copy.addSession}
        </motion.button>
      </div>

      <footer className="mt-3 border-t border-white/22 pt-[12px] pb-[13px] text-[15px] leading-[18px] text-white/90">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <motion.span key={total} initial={entrance.active ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="inline-block tabular-nums">
            {formatTotal(total)}
          </motion.span>
          {over > 0 && <OverPill minutes={over} />}
        </div>
        <AnimatePresence initial={false}>
          {over > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Button variant="glass" size="xs" className="mt-2.5 w-full" onClick={() => actions.rebalance(date)}>
                <Shuffle />
                Rééquilibrer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </motion.section>
  )
}
