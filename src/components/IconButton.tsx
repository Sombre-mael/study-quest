import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

import { cx } from '../lib/cx'
import type { ForcedState } from './Button'

type Tone = 'light' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const tones: Record<Tone, string> = {
  // On white cards and dialogs.
  light: 'text-[#5f6b6a] hover:bg-black/[0.05] hover:text-ink data-[force=hover]:bg-black/[0.05] data-[force=hover]:text-ink aria-expanded:bg-black/[0.06] aria-expanded:text-ink',
  // On the teal page.
  dark: 'text-white/85 hover:bg-white/14 hover:text-white data-[force=hover]:bg-white/14 data-[force=hover]:text-white aria-expanded:bg-white/16',
}

// Phones always get a 40px target, whatever the visual size.
const sizes: Record<Size, string> = {
  sm: 'h-7 w-8 max-sm:size-10 [&_svg]:size-[18px]',
  md: 'size-9 max-sm:size-10 [&_svg]:size-[18px]',
  lg: 'size-11 [&_svg]:size-5',
}

/** A round, icon-only button. `label` is required: it is the accessible name and the tooltip. */
export function IconButton({
  label,
  tone = 'light',
  size = 'md',
  forceState,
  className,
  children,
  ...rest
}: Omit<HTMLMotionProps<'button'>, 'children'> & { label: string; tone?: Tone; size?: Size; forceState?: ForcedState; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      data-force={forceState}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cx(
        'grid shrink-0 place-items-center rounded-[2px] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0',
        tones[tone],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
