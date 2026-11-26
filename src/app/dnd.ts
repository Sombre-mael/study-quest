import { useCallback, useState, type RefObject } from 'react'

import type { Item } from '../data'
import type { ISODate } from '../lib/dates'
import { captureFlight } from './motion'

export type Point = { x: number; y: number }

/** Where a pointer would drop a card: which day, and before which card. */
function locate(p: Point, dragId: string): { date: ISODate; index: number } | null {
  const hit = document
    .elementsFromPoint(p.x, p.y)
    .find((el) => !el.closest(`[data-card="${dragId}"]`) && el.closest('[data-day]'))
  const col = hit?.closest<HTMLElement>('[data-day]')
  if (!col) return null
  const cards = [...col.querySelectorAll<HTMLElement>('[data-card]')].filter((c) => c.dataset.card !== dragId)
  let index = cards.length
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i]!.getBoundingClientRect()
    if (p.y < r.top + r.height / 2) {
      index = i
      break
    }
  }
  return { date: col.dataset.day!, index }
}

/**
 * Drag a card onto any element with data-day (board columns, week columns).
 * Pass the horizontal scroller to nudge it when a card is held near an edge.
 */
export function useDayDnd(onMove: (id: string, date: ISODate, index: number) => void, scroller?: RefObject<HTMLElement | null>) {
  const [hotDay, setHotDay] = useState<ISODate | null>(null)

  const onDragMove = useCallback(
    (p: Point | null) => {
      if (!p) return setHotDay(null)
      const el = document.elementsFromPoint(p.x, p.y).find((e) => e.matches('[data-day]'))
      setHotDay((el as HTMLElement | undefined)?.dataset.day ?? null)
      const s = scroller?.current
      if (s) {
        const r = s.getBoundingClientRect()
        if (p.x < r.left + 60) s.scrollBy({ left: -14 })
        else if (p.x > r.right - 60) s.scrollBy({ left: 14 })
      }
    },
    [scroller],
  )

  const onDrop = useCallback(
    (item: Item, p: Point) => {
      const target = locate(p, item.id)
      if (!target) return false
      if (target.date === item.date && target.index === item.order) return false
      captureFlight(item.id)
      onMove(item.id, target.date, target.index)
      return true
    },
    [onMove],
  )

  return { hotDay, onDragMove, onDrop }
}
