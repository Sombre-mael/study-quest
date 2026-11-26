import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { useOverlay } from '../lib/useOverlay'
import { IconButton } from './IconButton'

/**
 * A centred sheet on desktop, a bottom sheet on phones. Escape and the
 * backdrop close it; focus is trapped inside and goes back to the trigger.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  useOverlay(open, panel, onClose)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-[#012c29]/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{ maxWidth: width }}
            className="on-light relative flex max-h-[88dvh] w-full flex-col rounded-t-dialog bg-card text-ink shadow-lift sm:max-h-[92dvh] sm:rounded-dialog"
          >
            <div className="flex items-start gap-4 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-[19px] leading-[1.2] font-semibold tracking-[-0.01em] sm:text-[20px]">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-[14px] leading-[1.45] text-ink-soft">
                    {description}
                  </p>
                )}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mt-1 -mr-2">
                <X />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 sm:px-6">{children}</div>
            {footer && (
              <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 pb-[calc(16px_+_env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
