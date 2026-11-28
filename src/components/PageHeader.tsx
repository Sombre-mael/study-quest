import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Title block for the inner pages: smaller than the hero, same voice. */
export function PageHeader({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="flex flex-wrap items-end justify-between gap-4 pt-[clamp(14px,3.2vh,48px)] pb-5 sm:pb-6"
    >
      <div className="min-w-0">
        <h1 className="font-display text-[clamp(19px,2.4vw,29px)] leading-[1.5]">{title}</h1>
        {intro && <p className="mt-2 max-w-[52ch] text-[16px] leading-[1.45] text-white/85">{intro}</p>}
      </div>
      {/* Phones: the page actions become a full-width row of thumb-sized
          buttons instead of a ragged left-aligned stack. */}
      {actions && <div className="flex flex-wrap items-center gap-2 max-sm:w-full max-sm:[&>*]:flex-1">{actions}</div>}
    </motion.div>
  )
}
