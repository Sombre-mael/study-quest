import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/**
 * The two surfaces of the app. `card` is the white card from the board, big
 * enough to hold a section; `glass` is the frosted day-column surface.
 */
export function Panel({
  tone = 'card',
  title,
  action,
  className,
  children,
  as: Tag = 'section',
}: {
  tone?: 'card' | 'glass'
  title?: ReactNode
  action?: ReactNode
  className?: string
  children: ReactNode
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <Tag
      className={cx(
        'rounded-column',
        tone === 'card'
          ? 'on-light bg-card p-5 text-ink shadow-card'
          : 'bg-column p-4 text-white shadow-[inset_0_0_0_2px_var(--color-column-edge),4px_4px_0_rgb(2_22_20/0.28)]',
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex min-h-8 items-center justify-between gap-3">
          {title && <h2 className="font-display text-[11px] leading-[1.7] uppercase">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </Tag>
  )
}
