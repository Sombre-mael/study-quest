import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * A circular progress ring. `value` is 0..1; `secondary` draws a lighter arc
 * behind it (e.g. what is planned but not done yet).
 */
export function ProgressRing({
  value,
  secondary,
  size = 44,
  stroke = 5,
  color = 'var(--color-teal-700)',
  track = '#e3eaea',
  label,
  children,
}: {
  value: number
  secondary?: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  /** Accessible description, e.g. "Ready 45%". Omit when text nearby says it. */
  label?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {secondary != null && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.28}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - clamp(secondary)) }}
            transition={{ type: 'spring', stiffness: 120, damping: 24 }}
          />
        )}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamp(value)) }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        />
      </svg>
      {children && <span className="absolute inset-0 grid place-items-center">{children}</span>}
    </span>
  )
}
