import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { cloneElement, isValidElement, useId, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'

import { subjectColors, subjectIcons, type IconKey } from '../data'
import { cx } from '../lib/cx'
import { inkFor, useSubjects } from '../lib/subjects'
import { SubjectChip } from './SubjectChip'

/**
 * A label above a control. Pass `error` to turn the control red and announce
 * the message; the control gets `aria-invalid` and `aria-describedby`.
 */
export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  const errId = useId()
  const control =
    error && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, { 'aria-invalid': true, 'aria-describedby': errId })
      : children
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-ink-soft">
        {label}
        {hint && <span className="font-normal text-ink-soft">{hint}</span>}
      </span>
      {control}
      {error && (
        <motion.span id={errId} role="alert" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 block text-[13px] text-[#b91c1c]">
          {error}
        </motion.span>
      )}
    </label>
  )
}

/** A field whose control is a group (radios), so it can't sit inside a <label>. */
export function FieldGroup({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-ink-soft">
        {label}
        {hint && <span className="font-normal text-ink-soft">{hint}</span>}
      </span>
      {children}
    </div>
  )
}

const control =
  'h-10 w-full rounded-[2px] bg-[#f3f6f6] px-3 text-[14.5px] text-ink shadow-[inset_0_0_0_1px_#dbe2e2] outline-none transition-shadow placeholder:text-[#6f7c7b] focus:bg-white focus:shadow-[inset_0_0_0_1.5px_var(--color-teal-700),0_0_0_4px_rgb(11_128_120/0.12)] data-[force=focus]:bg-white data-[force=focus]:shadow-[inset_0_0_0_1.5px_var(--color-teal-700),0_0_0_4px_rgb(11_128_120/0.12)] aria-invalid:shadow-[inset_0_0_0_1.5px_#dc2626,0_0_0_4px_rgb(220_38_38/0.1)] disabled:cursor-not-allowed disabled:opacity-55'

export function Input({ className, forceState, ...rest }: ComponentPropsWithoutRef<'input'> & { forceState?: 'focus' }) {
  return <input data-force={forceState} className={cx(control, className)} {...rest} />
}

type SegTone = 'light' | 'glass'

/** A row of options with a sliding highlight. `glass` sits on the teal page. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  format = String,
  name,
  tone = 'light',
  size = 'md',
  className,
}: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  format?: (v: T) => ReactNode
  /** Accessible name; also keys the sliding highlight, so keep it unique per screen. */
  name: string
  tone?: SegTone
  size?: 'sm' | 'md'
  className?: string
}) {
  const glass = tone === 'glass'
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cx(
        'flex flex-wrap gap-1 p-1',
        glass ? 'rounded-[2px] bg-white/12 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)] backdrop-blur-sm' : 'rounded-[2px] bg-[#f3f6f6] shadow-[inset_0_0_0_1px_#dbe2e2]',
        className,
      )}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        e.preventDefault()
        const i = options.indexOf(value)
        const next = options[(i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length]!
        onChange(next)
        requestAnimationFrame(() => e.currentTarget.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
      }}
    >
      {options.map((o) => {
        const on = o === value
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o)}
            className={cx(
              'relative min-w-12 flex-1 px-2.5 font-medium transition-colors',
              size === 'sm' ? 'h-7 text-[12.5px] max-sm:h-9' : 'h-8 text-[13px] max-sm:h-9',
              glass ? 'rounded-[2px]' : 'rounded-[2px]',
              glass ? (on ? 'text-teal-900' : 'text-white/95 hover:text-white') : on ? 'text-ink' : 'text-ink-soft hover:text-ink',
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${name}`}
                className={cx(
                  'absolute inset-0',
                  glass ? 'rounded-[2px] bg-white shadow-[0_2px_8px_-2px_rgb(0_0_0/0.2)]' : 'rounded-[2px] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.04)]',
                )}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5 [&_svg]:size-[14px]">{format(o)}</span>
          </button>
        )
      })}
    </div>
  )
}

const tile =
  'transition-[box-shadow,background-color] aria-checked:bg-white aria-checked:shadow-[inset_0_0_0_1.5px_var(--color-teal-700),0_0_0_3px_rgb(11_128_120/0.12)] aria-[checked=false]:bg-[#f3f6f6] aria-[checked=false]:shadow-[inset_0_0_0_1px_#dbe2e2] aria-[checked=false]:hover:bg-[#ebf0f0]'

function radioKeys(e: KeyboardEvent<HTMLDivElement>) {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const radios = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
  const i = radios.indexOf(document.activeElement as HTMLButtonElement)
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  const next = radios[(i + step + radios.length) % radios.length]
  next?.click()
  next?.focus()
}

export function SubjectPicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const { list } = useSubjects()
  return (
    <div role="radiogroup" aria-label="Subject" onKeyDown={radioKeys} className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {list.map((s) => {
        const active = s.id === value
        return (
          <motion.button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (!list.some((x) => x.id === value) && s === list[0]) ? 0 : -1}
            onClick={() => onChange(s.id)}
            whileTap={{ scale: 0.96 }}
            className={cx('flex h-10 items-center gap-2 rounded-[2px] px-2 text-left text-[13px] font-medium', tile)}
          >
            <SubjectChip subject={s} size={24} />
            <span className="truncate">{s.name}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

/** Round colour swatches; the chosen one gets a ring and a tick. */
export function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Colour" onKeyDown={radioKeys} className="flex flex-wrap gap-2">
      {subjectColors.map((c) => {
        const on = c.value === value
        return (
          <motion.button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.name}
            title={c.name}
            tabIndex={on ? 0 : -1}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(c.value)}
            className={cx(
              'grid size-9 place-items-center rounded-[2px] transition-shadow max-sm:size-10',
              on ? 'shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-teal-700)]' : 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] hover:shadow-[0_0_0_2px_#fff,0_0_0_4px_#cfd8d8]',
            )}
            style={{ background: c.value, color: inkFor(c.value) }}
          >
            {on && <Check size={16} strokeWidth={3} />}
          </motion.button>
        )
      })}
    </div>
  )
}

export function IconPicker({ value, color, onChange }: { value: IconKey; color: string; onChange: (k: IconKey) => void }) {
  const ink = inkFor(color)
  return (
    <div role="radiogroup" aria-label="Icon" onKeyDown={radioKeys} className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
      {(Object.keys(subjectIcons) as IconKey[]).map((k) => {
        const Icon = subjectIcons[k]
        const on = k === value
        return (
          <motion.button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={k}
            title={k}
            tabIndex={on ? 0 : -1}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(k)}
            className={cx('grid h-10 place-items-center rounded-[2px]', tile)}
          >
            <span className="grid size-7 place-items-center rounded-[2px]" style={on ? { background: color, color: ink } : { color: '#3d4a49' }}>
              <Icon size={16} strokeWidth={2.2} />
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
