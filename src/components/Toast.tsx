import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

import { Button } from './Button'

export type ToastState = { id: number; message: string; action?: { label: string; run: () => void } } | null

/** One toast at a time, bottom centre, gone after five seconds. */
export function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(t)
  }, [toast, onDismiss])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 print:hidden">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
            className="pointer-events-auto flex items-center gap-3 rounded-[2px] bg-[#072f2c]/94 py-1.5 pr-1.5 pl-4 text-[14px] text-white shadow-lift backdrop-blur"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <Button
                variant="glass"
                size="xs"
                onClick={() => {
                  toast.action!.run()
                  onDismiss()
                }}
              >
                {toast.action.label}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
