import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/** A friendly "nothing here yet" block: icon, one line, one next step. */
export function EmptyState({
  icon,
  title,
  body,
  actions,
  tone = 'light',
  className,
  as: Title = 'p',
}: {
  /** Heading level for the title when the empty state is the page's main content. */
  as?: 'p' | 'h1' | 'h2' | 'h3'
  icon: ReactNode
  title: string
  body?: ReactNode
  actions?: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={cx('flex flex-col items-center px-4 py-8 text-center', className)}
    >
      <span
        className={cx(
          'grid size-12 place-items-center rounded-[2px] [&_svg]:size-6',
          dark ? 'bg-white/14 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]' : 'bg-[#eef6f5] text-teal-700',
        )}
      >
        {icon}
      </span>
      <Title className={cx('mt-3 text-[16px] font-semibold tracking-[-0.015em]', dark ? 'text-white' : 'text-ink')}>{title}</Title>
      {body && <p className={cx('mt-1 max-w-[40ch] text-[14px] leading-[1.45]', dark ? 'text-white/85' : 'text-ink-soft')}>{body}</p>}
      {actions && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </motion.div>
  )
}
