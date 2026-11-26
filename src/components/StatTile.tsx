import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** One headline number on a white card: label, value, a line of context. */
export function StatTile({
  label,
  value,
  caption,
  icon,
  children,
  delay = 0,
}: {
  label: string
  value: ReactNode
  caption?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, delay }}
      className="on-light flex min-w-0 flex-col rounded-column bg-card p-4 text-ink shadow-card"
    >
      <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-soft">
        {label}
        {icon && <span className="grid size-8 place-items-center rounded-chip bg-[#eef6f5] text-teal-700 [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="mt-1 text-[30px] leading-[1.15] font-bold tracking-[-0.03em] tabular-nums">{value}</div>
      {caption && <div className="mt-0.5 text-[13px] leading-5 text-ink-soft">{caption}</div>}
      {children && <div className="mt-3">{children}</div>}
    </motion.div>
  )
}
