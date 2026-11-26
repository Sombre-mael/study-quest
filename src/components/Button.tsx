import { LoaderCircle } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

export type ButtonVariant = 'pill' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass' | 'link' | 'linkDark'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'
/** Pins a state on for the style guide; real use never sets it. */
export type ForcedState = 'hover' | 'focus' | 'active'

// Each hover rule is written twice, once for the pointer and once for the
// style guide's pinned state, so Tailwind sees every class literally.
const variants: Record<ButtonVariant, string> = {
  // The white hero pill.
  pill: 'bg-white text-teal-900 shadow-pill hover:bg-[#f4fbfa] data-[force=hover]:bg-[#f4fbfa]',
  // Teal on light surfaces (dialogs, cards).
  primary: 'bg-teal-900 text-white shadow-[0_0_0_2px_#10201f,3px_3px_0_rgb(2_30_28/0.45)] hover:bg-teal-950 data-[force=hover]:bg-teal-950',
  secondary: 'bg-[#efe7d3] text-ink shadow-[0_0_0_2px_#10201f,3px_3px_0_rgb(2_30_28/0.25)] hover:bg-[#e5dcc5] data-[force=hover]:bg-[#e5dcc5]',
  ghost: 'text-ink-soft hover:bg-black/[0.05] hover:text-ink data-[force=hover]:bg-black/[0.05] data-[force=hover]:text-ink',
  danger: 'bg-[#fdecec] text-[#b91c1c] shadow-[0_0_0_2px_#10201f,3px_3px_0_rgb(2_30_28/0.25)] hover:bg-[#fbdcdc] data-[force=hover]:bg-[#fbdcdc]',
  // Frosted, for controls that sit on the teal page.
  glass:
    'bg-white/14 text-white shadow-[inset_0_0_0_2px_rgb(255_255_255/0.35),3px_3px_0_rgb(2_22_20/0.3)] hover:bg-white/24 data-[force=hover]:bg-white/24',
  // Text-only actions. `link` on white, `linkDark` on teal. Phones still get a 40px row.
  link: 'h-auto! px-0! max-sm:min-h-10 text-ink-soft underline-offset-[3px] hover:text-ink hover:underline data-[force=hover]:text-ink data-[force=hover]:underline',
  linkDark:
    'h-auto! px-0! max-sm:min-h-10 text-white/88 underline underline-offset-[3px] decoration-white/45 hover:text-white hover:decoration-white data-[force=hover]:text-white data-[force=hover]:decoration-white',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 rounded-[2px] px-2.5 text-[12.5px] max-sm:h-10 max-sm:px-3.5',
  sm: 'h-8 rounded-[2px] px-3 text-[13px] max-sm:h-10',
  md: 'h-10 rounded-[2px] px-4 text-[14px]',
  lg: 'h-[49px] rounded-[2px] px-[39px] text-[15px]',
}

export type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner and blocks clicks. */
  loading?: boolean
  forceState?: ForcedState
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, forceState, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <motion.button
      type="button"
      data-force={forceState}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileHover={{ scale: variant === 'pill' ? 1.03 : 1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 font-semibold tracking-[0.04em] uppercase whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        !loading && 'disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </motion.button>
  )
}
