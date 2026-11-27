import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'

import { cx } from '../lib/cx'

export type BarDatum = { id: string; label: string; value: number; color: string; lead?: ReactNode; detail?: string }

function Tip({ show, children, className }: { show: boolean; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          role="tooltip"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={cx('pointer-events-none absolute z-10 rounded-[9px] bg-[#072f2c] px-2.5 py-1.5 text-[12.5px] whitespace-nowrap text-white shadow-pop', className)}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/**
 * Horizontal bars, one per row, each labelled with its name and value so the
 * colour only repeats what the text says. Rows show a tooltip on hover/focus.
 */
export function BarChart({ data, format, label }: { data: BarDatum[]; format: (v: number) => string; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const total = data.reduce((a, d) => a + d.value, 0)
  const [hover, setHover] = useState<string | null>(null)
  return (
    <ul aria-label={label} className="space-y-2.5">
      {data.map((d, i) => (
        <li
          key={d.id}
          tabIndex={0}
          onMouseEnter={() => setHover(d.id)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(d.id)}
          onBlur={() => setHover(null)}
          className="relative grid grid-cols-[minmax(92px,150px)_1fr_auto] items-center gap-3 rounded-[10px] px-1 py-1 outline-offset-1 hover:bg-[#f5f8f8]"
        >
          <span className="flex min-w-0 items-center gap-2 text-[13.5px] font-medium">
            {d.lead}
            <span className="truncate">{d.label}</span>
          </span>
          <span className="relative h-[14px] min-w-0">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-r-[4px] rounded-l-[2px]"
              style={{ background: d.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
              transition={{ type: 'spring', stiffness: 140, damping: 24, delay: 0.05 * i }}
            />
          </span>
          <span className="w-[62px] text-right text-[13px] text-ink-soft tabular-nums">{format(d.value)}</span>
          <Tip show={hover === d.id} className="-top-8 left-1/2 -translate-x-1/2">
            {d.label} · {format(d.value)} · {Math.round((d.value / Math.max(1, total)) * 100)}% of total
            {d.detail ? ` · ${d.detail}` : ''}
          </Tip>
        </li>
      ))}
    </ul>
  )
}

export type DayDatum = { date: string; label: string; short: string; value: number; today?: boolean }

/**
 * One column per day against a dashed limit line. A single series, so it is
 * one hue; today is the darker bar.
 */
export function DayBars({ data, limit, format, label }: { data: DayDatum[]; limit: number; format: (v: number) => string; label: string }) {
  const max = Math.max(limit || 0, ...data.map((d) => d.value), 30)
  const [hover, setHover] = useState<string | null>(null)
  return (
    <div role="img" aria-label={label} className="relative">
      <div className="relative flex h-[140px] items-end gap-[3px] border-b border-line sm:gap-1.5">
        {limit > 0 && (
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#c2410c]/60" style={{ bottom: `${(limit / max) * 100}%` }}>
            <span className="absolute -top-[18px] right-0 text-[11.5px] font-medium text-[#b13a0b]">Limite {format(limit)}</span>
          </div>
        )}
        {data.map((d, i) => (
          <div
            key={d.date}
            className="relative flex h-full flex-1 items-end justify-center"
            onMouseEnter={() => setHover(d.date)}
            onMouseLeave={() => setHover(null)}
          >
            <motion.div
              className={cx('w-full max-w-[26px] rounded-t-[4px]', d.today ? 'bg-teal-900' : 'bg-teal-500')}
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ type: 'spring', stiffness: 140, damping: 22, delay: 0.025 * i }}
              style={{ minHeight: d.value ? 3 : 0 }}
            />
            <Tip show={hover === d.date} className="bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2">
              {d.label} · {d.value ? format(d.value) : 'no study'}
            </Tip>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[3px] sm:gap-1.5" aria-hidden>
        {data.map((d) => (
          <span key={d.date} className={cx('flex-1 text-center text-[11px] text-ink-soft', d.today && 'font-semibold text-ink')}>
            {d.short}
          </span>
        ))}
      </div>
    </div>
  )
}
