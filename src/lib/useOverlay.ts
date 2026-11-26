import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Shared modal behaviour for dialogs and the focus timer: Escape closes, Tab is
 * trapped inside, the page behind stops scrolling, focus moves in on open and
 * returns to whatever opened it on close.
 */
export function useOverlay(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void) {
  // Read through a ref so a new onClose each render doesn't re-run the effect
  // (which would steal focus back to the first field).
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const returnTo = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // A menu inside the overlay handles its own Escape first.
        if (document.querySelector('[role="menu"]')) return
        e.preventDefault()
        close.current()
      }
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
        if (f.length === 0) return
        const first = f[0]!
        const last = f[f.length - 1]!
        if (!panel.current.contains(document.activeElement)) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Prefer the element marked data-autofocus, then the first field, then any button.
    const raf = requestAnimationFrame(() => {
      const p = panel.current
      const target = p?.querySelector<HTMLElement>('[data-autofocus]') ?? p?.querySelector<HTMLElement>('input, textarea, select') ?? p?.querySelector<HTMLElement>('button')
      target?.focus({ preventScroll: true })
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      if (returnTo && document.contains(returnTo)) returnTo.focus({ preventScroll: true })
    }
  }, [open, panel])
}
