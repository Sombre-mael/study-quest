import { AlertTriangle, Check, Flag } from 'lucide-react'
import type { ReactNode } from 'react'

import { cx } from '../lib/cx'
import { formatDuration } from '../lib/format'

export function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cx('inline-flex h-[23px] items-center gap-1 rounded-[2px] px-[12px] text-[13.5px] leading-none font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  )
}

/** Lavender time pill on a session card; green with a tick once done. */
export function DurationPill({ minutes, done }: { minutes: number; done?: boolean }) {
  return (
    <Pill className={done ? 'bg-[#e3f5ec] text-[#166534]' : 'bg-lavender text-lavender-ink'}>
      {done && <Check size={13} strokeWidth={2.6} />}
      {formatDuration(minutes)}
      {done && <span className="sr-only">, done</span>}
    </Pill>
  )
}

/** Orange flag pill on a test card. */
export function TestPill() {
  return (
    <Pill className="bg-flag pl-[10px] text-flag-ink">
      <Flag size={13} strokeWidth={2.2} />
      Test
    </Pill>
  )
}

/** The daily-limit warning on an overloaded day. */
export function OverPill({ minutes }: { minutes: number }) {
  return (
    <Pill className="bg-flag pl-[9px] text-[12.5px] text-flag-ink">
      <AlertTriangle size={12} strokeWidth={2.4} />
      {formatDuration(minutes)} over
    </Pill>
  )
}
