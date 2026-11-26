import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'

/** Period label with previous / next / today, above the week and month grids. */
export function CalendarToolbar({
  label,
  onPrev,
  onNext,
  onToday,
  isCurrent,
  unit,
  extra,
}: {
  label: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  isCurrent: boolean
  unit: 'week' | 'month'
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-(--board-pad) pb-3">
      <div className="flex items-center gap-1">
        <IconButton tone="dark" label={`Previous ${unit}`} onClick={onPrev}>
          <ChevronLeft />
        </IconButton>
        <IconButton tone="dark" label={`Next ${unit}`} onClick={onNext}>
          <ChevronRight />
        </IconButton>
        <h2 aria-live="polite" className="ml-1.5 text-[17px] font-semibold tracking-[-0.015em] tabular-nums">
          {label}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        {!isCurrent && (
          <Button variant="glass" size="sm" onClick={onToday}>
            This {unit}
          </Button>
        )}
        {extra}
      </div>
    </div>
  )
}
