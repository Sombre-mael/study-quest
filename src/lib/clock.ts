import { useEffect, useState } from 'react'

import { todayISO, type ISODate } from './dates'

/** Milliseconds from `now` to just past the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2)
  return Math.max(1000, tomorrow.getTime() - now.getTime())
}

/**
 * Today's local calendar day, kept true while the app stays open. An installed
 * app left running overnight used to keep yesterday's date, so the quests, the
 * chest and the streak were all still the previous day's until a reload.
 *
 * The date is re-read when the tab comes back into view, when the window
 * regains focus, and on a timer that lands just after midnight. Reading the
 * clock is enough: nothing about the saved plan changes.
 */
export function useToday(): ISODate {
  const [today, setToday] = useState<ISODate>(() => todayISO())

  useEffect(() => {
    let timer = 0
    const sync = () => {
      const next = todayISO()
      setToday((prev) => (prev === next ? prev : next))
      // Covers both midnight and a clock/timezone change; re-armed every time.
      window.clearTimeout(timer)
      timer = window.setTimeout(sync, msUntilMidnight())
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    window.addEventListener('focus', sync)
    window.addEventListener('pageshow', sync)
    document.addEventListener('visibilitychange', onVisible)
    timer = window.setTimeout(sync, msUntilMidnight())
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', sync)
      window.removeEventListener('pageshow', sync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return today
}
