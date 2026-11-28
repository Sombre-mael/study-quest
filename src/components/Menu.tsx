import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cx } from '../lib/cx'

export type MenuItem =
  | { type?: 'item'; label: string; icon?: ReactNode; danger?: boolean; onSelect: () => void }
  | { type: 'separator' }
  /** A read-only line, for a status that belongs with the actions. */
  | { type: 'note'; label: string; title?: string; icon?: ReactNode; warn?: boolean }

/**
 * A small popover menu anchored to a trigger element. It renders in a portal
 * so the board's horizontal scroller never clips it, and closes on outside
 * click, Escape or scroll.
 */
export function Menu({
  anchor,
  open,
  onClose,
  items,
  label,
}: {
  label?: string
  anchor: HTMLElement | null
  open: boolean
  onClose: () => void
  items: MenuItem[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null)

  const place = useCallback(() => {
    if (!anchor) return
    const r = anchor.getBoundingClientRect()
    const width = 196
    const height = items.length * (window.innerWidth < 640 ? 42 : 34) + 16
    const up = r.bottom + height + 12 > window.innerHeight
    setPos({
      top: up ? r.top - height - 6 : r.bottom + 6,
      left: Math.max(8, Math.min(window.innerWidth - width - 8, r.right - width)),
      up,
    })
    return r
  }, [anchor, items.length])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current?.contains(e.target as Node) || anchor?.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        anchor?.focus({ preventScroll: true })
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const buttons = [...(ref.current?.querySelectorAll('button') ?? [])]
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const next = e.key === 'ArrowDown' ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length
        buttons[next]?.focus()
      }
    }
    // Follow the trigger while the row scrolls or snaps; close once it leaves the screen.
    const onScroll = () => {
      const r = place()
      if (!r || r.right < 0 || r.left > window.innerWidth || r.bottom < 0 || r.top > window.innerHeight) onClose()
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onClose)
    requestAnimationFrame(() => ref.current?.querySelector('button')?.focus({ preventScroll: true }))
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onClose)
    }
  }, [open, anchor, onClose, place])

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={ref}
          role="menu"
          aria-label={label}
          initial={{ opacity: 0, scale: 0.94, y: pos.up ? 6 : -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
          style={{ top: pos.top, left: pos.left, transformOrigin: pos.up ? 'bottom right' : 'top right' }}
          className="on-light fixed z-50 w-[196px] rounded-[2px] bg-white p-1.5 text-ink shadow-pop"
        >
          {items.map((item, i) =>
            item.type === 'separator' ? (
              <div key={i} className="mx-2 my-1 h-px bg-line" />
            ) : item.type === 'note' ? (
              <p
                key={i}
                role="presentation"
                title={item.title}
                className={cx(
                  'flex h-8 items-center gap-2.5 px-2.5 text-[12.5px] leading-[1.2] text-ink-soft max-sm:h-10 [&_svg]:size-[15px] [&_svg]:shrink-0',
                  item.warn && 'text-[#8a5a12] [&_svg]:text-[#b4761a]',
                )}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </p>
            ) : (
              <button
                key={i}
                role="menuitem"
                type="button"
                onClick={() => {
                  onClose()
                  item.onSelect()
                }}
                className={cx(
                  'flex h-8 w-full items-center max-sm:h-10 gap-2.5 rounded-[2px] px-2.5 text-left text-[13.5px] outline-none transition-colors hover:bg-[#f1f4f4] focus-visible:bg-[#f1f4f4] [&_svg]:size-[15px] [&_svg]:text-ink-soft',
                  item.danger && 'text-danger [&_svg]:text-danger hover:bg-[#fdecec] focus-visible:bg-[#fdecec]',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
