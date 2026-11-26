import { motion } from 'motion/react'

import type { Readiness } from '../lib/insights'
import { ProgressRing } from './ProgressRing'

function tone(r: Readiness) {
  if (r.planned >= 0.85) return { color: '#0b8078', word: 'On track' }
  if (r.planned >= 0.5) return { color: '#c2410c', word: 'Needs more' }
  return { color: '#b91c1c', word: 'Behind' }
}

/**
 * How ready you are for a test. The solid fill is study already done; the
 * light fill is study still planned before the test. `ring` is the compact
 * form for test cards, `bar` the full one with words.
 */
export function ReadinessMeter({ value, variant = 'bar' }: { value: Readiness; variant?: 'bar' | 'ring' }) {
  const pct = Math.round(value.done * 100)
  const planned = Math.round(value.planned * 100)
  const t = tone(value)
  if (variant === 'ring') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft" title={`Ready ${pct}% · ${planned}% with what's planned`}>
        <ProgressRing value={value.done} secondary={value.planned} size={20} stroke={3} color={t.color} />
        <span className="tabular-nums">
          {pct}%<span className="sr-only"> ready, {planned}% with planned study</span>
        </span>
      </span>
    )
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-medium" style={{ color: t.color }}>
          {t.word}
        </span>
        <span className="text-ink-soft tabular-nums">
          {pct}% ready · {planned}% with plan
        </span>
      </div>
      <div
        role="meter"
        aria-label="Exam readiness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}% ready, ${planned}% with planned study`}
        className="relative mt-1.5 h-2 overflow-hidden rounded-[2px] bg-[#e6eded]"
      >
        <motion.span
          className="absolute inset-y-0 left-0 rounded-[2px]"
          style={{ background: t.color, opacity: 0.28 }}
          initial={{ width: 0 }}
          animate={{ width: `${planned}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        />
        <motion.span
          className="absolute inset-y-0 left-0 rounded-[2px]"
          style={{ background: t.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24, delay: 0.08 }}
        />
      </div>
    </div>
  )
}
