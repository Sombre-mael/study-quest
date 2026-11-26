import { CalendarArrowDown, CalendarArrowUp, Check, Copy, Gamepad2, MoreHorizontal, Pencil, Play, RotateCcw, Timer, Trash2, Undo2 } from 'lucide-react'
import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { DateBadge } from '../components/DateBadge'
import { IconButton } from '../components/IconButton'
import { Menu, type MenuItem } from '../components/Menu'
import { DurationPill, TestPill } from '../components/Pill'
import { ReadinessMeter } from '../components/ReadinessMeter'
import { SubjectChip } from '../components/SubjectChip'
import type { Item } from '../data'
import { cx } from '../lib/cx'
import type { ISODate } from '../lib/dates'
import { XP_PER_TICK } from '../lib/game'
import type { Readiness } from '../lib/insights'
import type { Point } from './dnd'
import { entrance, flight, spring } from './motion'

export type CardActions = {
  edit: (item: Item) => void
  duplicate: (item: Item) => void
  shift: (item: Item, days: number) => void
  toggleDone: (item: Item) => void
  remove: (item: Item) => void
  replan: (item: Item) => void
  /** Open the full-screen focus timer for a session. */
  focus: (item: Item) => void
  /** Play the warm-up memory game for bonus XP. */
  warmUp: (item: Item) => void
  /** Move sessions off an overloaded day. */
  rebalance: (date: ISODate) => void
  readiness: (test: Item) => Readiness
}

export function SessionCard({
  item,
  delay,
  actions,
  onDragMove,
  onDrop,
  compact = false,
  draggable = true,
}: {
  item: Item
  /** Narrow week-view card: no play button, smaller title. */
  compact?: boolean
  /** Off in one-day lists, where there is no column to drag a card onto. */
  draggable?: boolean
  delay: number
  actions: CardActions
  onDragMove: (p: Point | null) => void
  onDrop: (item: Item, p: Point) => boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const controls = useDragControls()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const reduce = useReducedMotion()
  const pressTimer = useRef<number | null>(null)
  const isTest = item.kind === 'test'

  // FLIP: if this card just moved, start it where it was and spring home.
  const landing = flight.id === item.id
  useLayoutEffect(() => {
    if (flight.id !== item.id || !ref.current) return
    flight.id = null
    const r = ref.current.getBoundingClientRect()
    const nx = r.left + r.width / 2 - x.get()
    const ny = r.top + r.height / 2 - y.get()
    if (reduce) {
      x.set(0)
      y.set(0)
      return
    }
    x.set(flight.x - nx)
    y.set(flight.y - ny)
    animate(x, 0, spring)
    animate(y, 0, spring)
  }, [item.date, item.order, item.id, x, y, reduce])

  // Mouse drags start at once; touch needs a short press so swipes still scroll.
  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (e.pointerType === 'mouse') {
      if (e.button === 0) controls.start(e)
      return
    }
    const start = { x: e.clientX, y: e.clientY }
    const native = e.nativeEvent
    const cancel = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8) clear()
    }
    const clear = () => {
      if (pressTimer.current) window.clearTimeout(pressTimer.current)
      pressTimer.current = null
      window.removeEventListener('pointermove', cancel)
      window.removeEventListener('pointerup', clear)
    }
    window.addEventListener('pointermove', cancel)
    window.addEventListener('pointerup', clear)
    pressTimer.current = window.setTimeout(() => {
      clear()
      navigator.vibrate?.(8)
      controls.start(native)
    }, 280)
  }

  const menu: MenuItem[] = isTest
    ? [
        { label: 'Edit test', icon: <Pencil />, onSelect: () => actions.edit(item) },
        { label: 'Re-plan sessions', icon: <RotateCcw />, onSelect: () => actions.replan(item) },
        { label: 'Move a day earlier', icon: <CalendarArrowUp />, onSelect: () => actions.shift(item, -1) },
        { label: 'Move a day later', icon: <CalendarArrowDown />, onSelect: () => actions.shift(item, 1) },
        { type: 'separator' },
        { label: 'Delete test', icon: <Trash2 />, danger: true, onSelect: () => actions.remove(item) },
      ]
    : [
        ...(item.done ? [] : [{ label: 'Start focus', icon: <Timer />, onSelect: () => actions.focus(item) } satisfies MenuItem]),
        { label: 'Edit', icon: <Pencil />, onSelect: () => actions.edit(item) },
        { label: item.done ? 'Mark not done' : 'Mark done', icon: item.done ? <Undo2 /> : <Check />, onSelect: () => actions.toggleDone(item) },
        { label: 'Duplicate', icon: <Copy />, onSelect: () => actions.duplicate(item) },
        { label: 'Warm-up game (+XP)', icon: <Gamepad2 />, onSelect: () => actions.warmUp(item) },
        { label: 'Move to day before', icon: <CalendarArrowUp />, onSelect: () => actions.shift(item, -1) },
        { label: 'Move to next day', icon: <CalendarArrowDown />, onSelect: () => actions.shift(item, 1) },
        { type: 'separator' },
        { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => actions.remove(item) },
      ]

  return (
    <motion.div
      ref={ref}
      data-card={item.id}
      layout={landing || dragging ? false : 'position'}
      drag={draggable}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragSnapToOrigin={false}
      onPointerDown={draggable ? onPointerDown : undefined}
      onDragStart={() => {
        setDragging(true)
        setMenuOpen(false)
      }}
      onDrag={(_, info) => onDragMove({ x: info.point.x - window.scrollX, y: info.point.y - window.scrollY })}
      onDragEnd={(_, info) => {
        setDragging(false)
        onDragMove(null)
        const moved = onDrop(item, { x: info.point.x - window.scrollX, y: info.point.y - window.scrollY })
        if (!moved) {
          animate(x, 0, spring)
          animate(y, 0, spring)
        }
      }}
      style={{ x, y, zIndex: dragging ? 30 : undefined }}
      initial={entrance.active ? { opacity: 0, y: 14, scale: 0.97 } : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, y: dragging || landing ? undefined : 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      whileDrag={{ scale: 1.04, rotate: -1.5, boxShadow: 'var(--shadow-lift)', cursor: 'grabbing' }}
      whileHover={dragging ? undefined : { y: -2, boxShadow: 'var(--shadow-card-hover)' }}
      transition={{ ...spring, delay: entrance.active ? delay : 0, layout: spring }}
      className={cx(
        'group on-light relative cursor-grab touch-pan-x touch-pan-y rounded-card bg-card pt-[12px] pb-[13px] text-ink shadow-card select-none',
        compact ? 'px-[10px]' : 'px-[11px]',
        item.done && 'bg-[#f6efdd]',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        {isTest ? <DateBadge date={item.date} /> : <SubjectChip subject={item.subject} />}
        <div className="-mt-[2px] -mr-[2px] flex items-center max-sm:-mt-1.5 max-sm:-mr-1.5">
          {!isTest && !item.done && !compact && (
            <IconButton
              label={`Start focus on ${item.title}`}
              size="sm"
              onClick={() => actions.focus(item)}
              className="text-teal-700 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <Play fill="currentColor" className="size-[14px]!" />
            </IconButton>
          )}
          <IconButton
            ref={menuButton}
            label={`Options for ${item.title}`}
            size="sm"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreHorizontal strokeWidth={2.2} />
          </IconButton>
        </div>
      </div>
      <p
        className={cx(
          'mt-[10px] font-medium tracking-[-0.012em] break-words',
          compact ? 'text-[14px] leading-[18px]' : 'text-[15.5px] leading-5',
          item.done && 'text-ink-soft line-through decoration-ink-soft/60',
        )}
      >
        {item.title}
      </p>
      {item.subtitle && <p className={cx('mt-px truncate leading-5 text-[#5f6b6a]', compact ? 'text-[13px]' : 'text-[14px]')}>{item.subtitle}</p>}
      <div className="mt-[8px] flex min-h-[25px] flex-wrap items-center justify-between gap-1.5">
        {isTest ? <TestPill /> : <DurationPill minutes={item.minutes} done={item.done} />}
        {isTest ? (
          <ReadinessMeter variant="ring" value={actions.readiness(item)} />
        ) : (
          <span
            className={cx('text-[12px] font-semibold tabular-nums', item.done ? 'text-ink-soft' : 'text-teal-700')}
            title={item.done ? `${item.minutes + XP_PER_TICK} XP earned` : `Worth ${item.minutes + XP_PER_TICK} XP`}
          >
            +{item.minutes + XP_PER_TICK} XP
          </span>
        )}
      </div>
      <Menu label={`${item.title} options`} anchor={menuButton.current} open={menuOpen} onClose={() => setMenuOpen(false)} items={menu} />
    </motion.div>
  )
}
