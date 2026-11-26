import { CalendarPlus, ChartColumn, Clock, Copy, Flame, Pencil, Play, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { Button, type ButtonVariant, type ForcedState } from '../components/Button'
import { BarChart, DayBars } from '../components/Charts'
import { DateBadge } from '../components/DateBadge'
import { Dialog } from '../components/Dialog'
import { ColorPicker, Field, FieldGroup, IconPicker, Input, Segmented, SubjectPicker } from '../components/Field'
import { EmptyState } from '../components/EmptyState'
import { IconButton } from '../components/IconButton'
import { Logo } from '../components/Logo'
import { Menu } from '../components/Menu'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { DurationPill, OverPill, TestPill } from '../components/Pill'
import { ProgressRing } from '../components/ProgressRing'
import { ReadinessMeter } from '../components/ReadinessMeter'
import { StatTile } from '../components/StatTile'
import { SubjectChip } from '../components/SubjectChip'
import { Toast, type ToastState } from '../components/Toast'
import { copy, subjectColors, type IconKey, type Item } from '../data'
import { cx } from '../lib/cx'
import { addDays, todayISO } from '../lib/dates'
import { formatDuration } from '../lib/format'
import type { Readiness } from '../lib/insights'
import { useSubjects } from '../lib/subjects'
import { DayColumn } from './DayColumn'
import { motionTokens } from './motion'
import { PageShell } from './PageShell'
import type { CardActions } from './SessionCard'

// The design system, documented with the real components. Every specimen
// below is the component the app uses, not a picture of it.

const colorTokens = [
  ['teal-950', 'Page top, pressed primary'],
  ['teal-900', 'Page, primary button, pill text'],
  ['teal-700', 'Focus rings on white, accents'],
  ['teal-500', 'Page bottom, chart bars'],
  ['ink', 'Text on white'],
  ['ink-soft', 'Secondary text on white (AA)'],
  ['ink-faint', 'Decoration only, never text'],
  ['card', 'Cards, dialogs, panels'],
  ['line', 'Rules on white'],
  ['column', 'Frosted day column (white 17%)'],
  ['column-edge', 'Column hairline'],
  ['column-hot', 'Column under a dragged card'],
  ['lavender', 'Duration pill'],
  ['lavender-ink', 'Duration pill text'],
  ['flag', 'Test pill, warnings'],
  ['flag-ink', 'Test pill text'],
  ['today', 'Today dot'],
  ['danger', 'Destructive actions'],
  ['success', 'Done text'],
  ['success-soft', 'Done pill'],
] as const

const typeScale = [
  { name: 'Display', cls: 'text-[69px] leading-[1.08] font-bold tracking-[-0.03em]', spec: '69 / 700 / -3%', sample: 'Study Planner' },
  { name: 'Page title', cls: 'text-[46px] leading-[1.08] font-bold tracking-[-0.03em]', spec: '46 / 700 / -3%', sample: 'Progress' },
  { name: 'Stat', cls: 'text-[30px] leading-[1.15] font-bold tracking-[-0.03em]', spec: '30 / 700', sample: '4h 20m' },
  { name: 'Section', cls: 'text-[19px] font-semibold tracking-[-0.02em]', spec: '19 / 600', sample: 'Plan for a test' },
  { name: 'Lead', cls: 'text-[18px] leading-[1.45]', spec: '18 / 400', sample: 'Spread your studying across the days before each test.' },
  { name: 'Card title', cls: 'text-[15.5px] leading-5 font-medium tracking-[-0.012em]', spec: '15.5 / 500', sample: 'Maths past paper' },
  { name: 'Column label', cls: 'text-[15px]', spec: '15 / 400', sample: 'Wed 11' },
  { name: 'Body', cls: 'text-[14.5px]', spec: '14.5 / 400', sample: 'Causes of WW1 — three points' },
  { name: 'Small', cls: 'text-[13px] font-medium', spec: '13 / 500', sample: 'Total study time' },
  { name: 'Micro', cls: 'text-[11px]', spec: '11 / 400', sample: 'M T W T F S S' },
]

const spacing = [4, 6, 8, 10, 12, 15, 16, 20, 24, 32, 40]
const radii = [
  ['chip', '9px'],
  ['card', '13px'],
  ['column', '18px'],
  ['dialog', '22px'],
  ['full', '9999px'],
] as const
const shadows = ['card', 'card-hover', 'pill', 'pop', 'lift'] as const

const sections = [
  ['colour', 'Colour'],
  ['type', 'Type'],
  ['space', 'Space & shape'],
  ['motion', 'Motion'],
  ['buttons', 'Buttons'],
  ['inputs', 'Inputs'],
  ['display', 'Display'],
  ['overlays', 'Overlays'],
  ['data', 'Data'],
  ['planner', 'Planner pieces'],
] as const

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 pt-10">
      <h2 id={`${id}-h`} className="text-[26px] font-bold tracking-[-0.025em]">
        {title}
      </h2>
      {intro && <p className="mt-1 max-w-[62ch] text-[15px] leading-[1.5] text-white/88">{intro}</p>}
      <div className="mt-4 space-y-3.5">{children}</div>
    </section>
  )
}

/** One component: name, when to use it, and live specimens. */
function Specimen({ name, usage, tone = 'card', children }: { name: string; usage: string; tone?: 'card' | 'glass'; children: ReactNode }) {
  return (
    <Panel tone={tone}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-mono text-[14px] font-semibold">{name}</h3>
        <p className={cx('max-w-[70ch] text-[13.5px] leading-[1.45]', tone === 'card' ? 'text-ink-soft' : 'text-white')}>{usage}</p>
      </div>
      {children}
    </Panel>
  )
}

function Label({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <span className={cx('block text-[12px] font-medium', dark ? 'text-white/85' : 'text-ink-soft')}>{children}</span>
}

const states: Array<{ label: string; force?: ForcedState; disabled?: boolean; loading?: boolean }> = [
  { label: 'Default' },
  { label: 'Hover', force: 'hover' },
  { label: 'Focus-visible', force: 'focus' },
  { label: 'Pressed', force: 'active' },
  { label: 'Disabled', disabled: true },
  { label: 'Loading', loading: true },
]

function ButtonMatrix({ variants, dark }: { variants: ButtonVariant[]; dark?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
        <thead>
          <tr>
            <th className="w-[90px]">
              <Label dark={dark}>Variant</Label>
            </th>
            {states.map((s) => (
              <th key={s.label}>
                <Label dark={dark}>{s.label}</Label>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v}>
              <td className={cx('font-mono text-[12.5px]', dark ? 'text-white' : 'text-ink')}>{v}</td>
              {states.map((s) => (
                <td key={s.label} className="pr-2">
                  <Button variant={v} size="sm" forceState={s.force} disabled={s.disabled} loading={s.loading} tabIndex={-1} aria-hidden={s.label !== 'Default' || undefined}>
                    {v === 'link' || v === 'linkDark' ? 'Reset plan' : 'Save'}
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function useTokenValues() {
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement)
    const out: Record<string, string> = {}
    for (const [name] of colorTokens) out[name] = cs.getPropertyValue(`--color-${name}`).trim()
    setValues(out)
  }, [])
  return values
}

function MotionDemo({ name, transition, use, run }: { name: string; transition: object; use: string; run: number }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center gap-4 py-2 max-sm:grid-cols-1 max-sm:gap-1">
      <div>
        <p className="font-mono text-[13px] font-semibold">{name}</p>
        <p className="text-[12.5px] text-ink-soft">{use}</p>
      </div>
      <div className="relative h-9 rounded-full bg-[#f3f6f6]">
        <motion.span
          key={run}
          className="absolute top-1.5 left-1.5 size-6 rounded-full bg-teal-700"
          initial={{ x: 0 }}
          animate={{ x: 'min(220px, 40vw)' }}
          transition={transition}
        />
      </div>
    </div>
  )
}

export function StyleGuide() {
  const today = useMemo(() => todayISO(), [])
  const tokens = useTokenValues()
  const { list } = useSubjects()
  const [run, setRun] = useState(0)
  const [seg, setSeg] = useState<number>(45)
  const [glassSeg, setGlassSeg] = useState<'Days' | 'Week' | 'Month'>('Days')
  const [subject, setSubject] = useState(list[0]?.id ?? '')
  const [color, setColor] = useState(subjectColors[0]!.value)
  const [icon, setIcon] = useState<IconKey>('flask')
  const [dialog, setDialog] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [loading, setLoading] = useState(false)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const sid = (n: number) => list[n % Math.max(1, list.length)]?.id ?? ''

  // Planner specimens run on their own little state so they can be clicked.
  const [demo, setDemo] = useState<Item[]>(() => [
    { id: 'sg-1', kind: 'session', subject: sid(1), title: 'Maths past paper', subtitle: '2023 paper 2, timed', minutes: 60, date: today, order: 0 },
    { id: 'sg-2', kind: 'session', subject: sid(2), title: 'Flashcards', minutes: 20, date: today, order: 1, done: true },
    { id: 'sg-3', kind: 'test', subject: sid(0), title: 'Chemistry test', minutes: 0, date: today, order: 2, target: 180 },
    { id: 'sg-4', kind: 'session', subject: sid(3), title: 'History essay plan', minutes: 90, date: addDays(today, 1), order: 0 },
    { id: 'sg-5', kind: 'session', subject: sid(4), title: 'Biology recap', minutes: 75, date: addDays(today, 1), order: 1 },
  ])
  const demoReady: Readiness = { done: 0.45, planned: 0.9, target: 180, studied: 81 }
  const demoActions: CardActions = {
    edit: (i) => setToast({ id: Date.now(), message: `Edit ${i.title}` }),
    duplicate: (i) => setToast({ id: Date.now(), message: `Duplicate ${i.title}` }),
    shift: (i) => setToast({ id: Date.now(), message: `Move ${i.title}` }),
    toggleDone: (i) => setDemo((d) => d.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x))),
    remove: (i) => setDemo((d) => d.filter((x) => x.id !== i.id)),
    replan: (i) => setToast({ id: Date.now(), message: `Re-plan ${i.title}` }),
    focus: (i) => setToast({ id: Date.now(), message: `Focus on ${i.title} (opens the timer in the app)` }),
    warmUp: (i) => setToast({ id: Date.now(), message: `Warm-up game for ${i.title} (opens in the app)` }),
    rebalance: () => setToast({ id: Date.now(), message: 'Rebalance moves the last sessions to days with room' }),
    readiness: () => demoReady,
  }
  const col = (date: string) => demo.filter((d) => d.date === date)
  const noDrag = { onDragMove: () => {}, onDrop: () => false }

  return (
    <PageShell wide>
      <PageHeader
        title={copy.styleguideTitle}
        intro="Tokens and components of the Study Planner, rendered by the components the app uses. One theme: teal page, white cards."
      />
      <nav aria-label="Style guide sections" className="flex flex-wrap gap-1.5">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex h-9 items-center rounded-full bg-white/12 px-3.5 text-[13.5px] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)] transition-colors hover:bg-white/22 max-sm:h-10">
            {label}
          </a>
        ))}
      </nav>

      <Section id="colour" title="Colour" intro="Tokens live in src/styles.css under @theme and become Tailwind utilities (bg-teal-900, text-ink-soft…). Values below are read live from the page.">
        <Panel>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {colorTokens.map(([name, use]) => (
              <li key={name}>
                <span className="block h-14 rounded-[12px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" style={{ background: `var(--color-${name})` }} />
                <p className="mt-1.5 font-mono text-[12.5px] font-semibold">{name}</p>
                <p className="font-mono text-[12px] text-ink-soft">{tokens[name] || '…'}</p>
                <p className="text-[12px] leading-4 text-ink-soft">{use}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Subject colours" action={<span className="text-[12.5px] text-ink-soft">src/data.ts · subjectColors</span>}>
          <ul className="flex flex-wrap gap-3">
            {subjectColors.map((c) => (
              <li key={c.value} className="flex items-center gap-2">
                <span className="size-8 rounded-chip" style={{ background: c.value }} />
                <span className="text-[12.5px]">
                  <span className="block font-medium">{c.name}</span>
                  <span className="font-mono text-ink-soft">{c.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Page gradient">
          <div className="h-16 rounded-[12px]" style={{ background: 'linear-gradient(90deg, var(--color-teal-900) 0%, #06716b 45%, var(--color-teal-500) 100%)' }} />
          <p className="mt-2 text-[13px] text-ink-soft">teal-900 → #06716b → teal-500, top to bottom, fixed to the viewport.</p>
        </Panel>
      </Section>

      <Section id="type" title="Type" intro="Inter throughout (Google Fonts, system fallbacks). Tight tracking on big sizes, tabular numbers wherever times line up.">
        <Panel>
          <ul className="divide-y divide-line">
            {typeScale.map((t) => (
              <li key={t.name} className="grid items-baseline gap-1 py-3 sm:grid-cols-[150px_1fr]">
                <span>
                  <span className="block text-[13px] font-semibold">{t.name}</span>
                  <span className="font-mono text-[12px] text-ink-soft">{t.spec}</span>
                </span>
                <span className={cx(t.cls, 'min-w-0 break-words max-sm:text-[min(100%,9vw)]')}>{t.sample}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </Section>

      <Section id="space" title="Space & shape" intro="Spacing follows the reference's measured gaps rather than a strict 4px grid; these are the steps in use.">
        <Panel title="Spacing">
          <ul className="flex flex-wrap items-end gap-3">
            {spacing.map((n) => (
              <li key={n} className="flex flex-col items-center gap-1">
                <span className="rounded-[3px] bg-teal-500" style={{ width: n, height: n }} />
                <span className="font-mono text-[12px] text-ink-soft">{n}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Panel title="Radii">
            <ul className="flex flex-wrap gap-4">
              {radii.map(([n, v]) => (
                <li key={n} className="text-center">
                  <span className="block size-16 bg-[#e6f1f0] shadow-[inset_0_0_0_1.5px_var(--color-teal-700)]" style={{ borderRadius: v }} />
                  <span className="mt-1 block font-mono text-[12px]">{n}</span>
                  <span className="font-mono text-[12px] text-ink-soft">{v}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Elevation">
            <ul className="flex flex-wrap gap-5 rounded-[12px] bg-[#f3f6f6] p-4">
              {shadows.map((n) => (
                <li key={n} className="text-center">
                  <span className="block size-16 rounded-card bg-white" style={{ boxShadow: `var(--shadow-${n})` }} />
                  <span className="mt-2 block font-mono text-[12px]">{n}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </Section>

      <Section id="motion" title="Motion" intro="Springs for anything that moves (src/app/motion.ts), CSS durations for colour and opacity. Everything respects the system reduce-motion setting.">
        <Panel
          title="Springs"
          action={
            <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)}>
              <RotateCcw />
              Replay
            </Button>
          }
        >
          {Object.entries(motionTokens).map(([name, t]) => {
            const { use, ...transition } = t
            return <MotionDemo key={name} name={name} use={`${use} · ${transition.stiffness}/${transition.damping}`} transition={transition} run={run} />
          })}
          {(
            [
              ['duration-fast', '120ms', 'Toggles, small fades'],
              ['duration-base', '180ms', 'Colour and background changes'],
              ['duration-slow', '320ms', 'Larger fades, focus timer screens'],
            ] as const
          ).map(([n, v, use]) => (
            <MotionDemo key={n} name={n} use={`${use} · ${v} ease-out`} transition={{ duration: parseInt(v) / 1000, ease: [0.22, 1, 0.36, 1] }} run={run} />
          ))}
        </Panel>
        <Panel title="Ambient keyframes">
          <div className="flex flex-wrap items-center gap-8">
            <span className="flex items-center gap-2 text-[13px]">
              <span className="size-[6px] animate-pulse-dot rounded-full bg-today" /> pulse-dot · today marker, 2.4s
            </span>
            <span className="flex items-center gap-2 text-[13px]">
              <span className="size-10 animate-breathe rounded-full bg-[radial-gradient(closest-side,var(--color-teal-500),transparent)]" /> breathe · focus timer, 8s
            </span>
            <span className="flex items-center gap-2 text-[13px]">
              <span className="relative size-10 overflow-hidden rounded-full bg-teal-900">
                <span className="absolute inset-0 animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(64_196_180/0.6),transparent)]" />
              </span>
              drift · page light, 22s
            </span>
          </div>
        </Panel>
      </Section>

      <Section id="buttons" title="Buttons" intro="Hover, focus and pressed are pinned on here with forceState so you can see them side by side.">
        <Specimen name="<Button>" usage="primary for the main action in a dialog; secondary for a second option; ghost for Cancel; danger for delete; link for quiet text actions on white.">
          <ButtonMatrix variants={['primary', 'secondary', 'ghost', 'danger', 'link']} />
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Label>Sizes</Label>
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="md">
              <Sparkles />
              With icon
            </Button>
            <Button
              size="md"
              variant="secondary"
              loading={loading}
              onClick={() => {
                setLoading(true)
                window.setTimeout(() => setLoading(false), 1400)
              }}
            >
              {loading ? 'Saving…' : 'Try loading'}
            </Button>
          </div>
        </Specimen>
        <Specimen tone="glass" name="<Button variant=pill | glass | linkDark>" usage="pill is the one white call to action on the teal page (Start planning). glass is for secondary controls on teal. linkDark is a text action on teal.">
          <ButtonMatrix variants={['pill', 'glass', 'linkDark']} dark />
        </Specimen>
        <Specimen name="<IconButton>" usage="Icon-only actions. label is required (accessible name and tooltip). tone=light on white, dark on teal. Always 40px on phones.">
          <div className="flex flex-wrap items-center gap-6">
            {states.slice(0, 5).map((s) => (
              <span key={s.label} className="flex flex-col items-center gap-1">
                <IconButton label={`Edit (${s.label})`} forceState={s.force} disabled={s.disabled} tabIndex={s.label === 'Default' ? 0 : -1}>
                  <Pencil />
                </IconButton>
                <Label>{s.label}</Label>
              </span>
            ))}
            <span className="flex flex-col items-center gap-1">
              <span className="flex items-center gap-1">
                <IconButton label="Small" size="sm">
                  <Copy />
                </IconButton>
                <IconButton label="Medium" size="md">
                  <Copy />
                </IconButton>
                <IconButton label="Large" size="lg">
                  <Copy />
                </IconButton>
              </span>
              <Label>sm · md · lg</Label>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[14px] bg-teal-900 p-3">
            <IconButton tone="dark" label="Play">
              <Play />
            </IconButton>
            <IconButton tone="dark" label="Hover state" forceState="hover" tabIndex={-1}>
              <Play />
            </IconButton>
            <IconButton tone="dark" label="Expanded state" aria-expanded tabIndex={-1}>
              <Play />
            </IconButton>
            <span className="text-[12.5px] text-white/85">tone=dark: default, hover, expanded</span>
          </div>
        </Specimen>
      </Section>

      <Section id="inputs" title="Inputs">
        <Specimen name="<Field> + <Input>" usage="Every text control sits in a Field: label above, optional hint on the right, error below. Errors set aria-invalid and are announced.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Default" hint="Optional">
              <Input placeholder="Chapter 3, questions 1–10" />
            </Field>
            <Field label="Focus">
              <Input forceState="focus" defaultValue="Forces worksheet" tabIndex={-1} />
            </Field>
            <Field label="Error" error="Give the subject a name.">
              <Input defaultValue="" placeholder="e.g. Computer science" />
            </Field>
            <Field label="Disabled">
              <Input disabled defaultValue="Locked" />
            </Field>
          </div>
        </Specimen>
        <Specimen name="<Segmented>" usage="Pick one of a few options. Arrow keys move the choice. tone=glass on teal (view switcher), light in dialogs.">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Session length (light)">
              <Segmented name="sg-length" value={seg} options={[15, 20, 30, 45, 60, 90]} onChange={setSeg} format={(v) => (v < 60 ? `${v}m` : formatDuration(v))} />
            </FieldGroup>
            <div className="rounded-[14px] bg-teal-900 p-3">
              <Label dark>View (glass)</Label>
              <Segmented name="sg-view" tone="glass" size="sm" value={glassSeg} options={['Days', 'Week', 'Month'] as const} onChange={setGlassSeg} className="mt-1.5" />
            </div>
          </div>
        </Specimen>
        <Specimen name="<SubjectPicker> · <ColorPicker> · <IconPicker>" usage="Radio groups of tiles and swatches. The chosen tile gets the teal ring; arrow keys move between options.">
          <div className="space-y-4">
            <FieldGroup label="Subject">
              <SubjectPicker value={subject} onChange={setSubject} />
            </FieldGroup>
            <FieldGroup label="Colour">
              <ColorPicker value={color} onChange={setColor} />
            </FieldGroup>
            <FieldGroup label="Icon">
              <IconPicker value={icon} color={color} onChange={setIcon} />
            </FieldGroup>
          </div>
        </Specimen>
      </Section>

      <Section id="display" title="Display">
        <Specimen name="<SubjectChip> · <DateBadge>" usage="The chip opens every session card; the tear-off date opens every test card. Size with the size prop; glyph colour is picked for contrast.">
          <div className="flex flex-wrap items-end gap-4">
            {list.slice(0, 8).map((s) => (
              <SubjectChip key={s.id} subject={s} />
            ))}
            <span className="mx-2 h-8 w-px bg-line" />
            <SubjectChip subject={{ id: 'x', name: 'Custom', color, icon }} size={20} />
            <SubjectChip subject={{ id: 'x', name: 'Custom', color, icon }} size={31} />
            <SubjectChip subject={{ id: 'x', name: 'Custom', color, icon }} size={44} />
            <span className="mx-2 h-8 w-px bg-line" />
            <DateBadge date={today} size={20} />
            <DateBadge date={today} />
            <DateBadge date={today} size={44} />
          </div>
        </Specimen>
        <Specimen name="<Pill>" usage="DurationPill on sessions (green with a tick once done), TestPill on tests, OverPill when a day goes past the daily limit.">
          <div className="flex flex-wrap items-center gap-2">
            <DurationPill minutes={30} />
            <DurationPill minutes={90} />
            <DurationPill minutes={45} done />
            <TestPill />
            <OverPill minutes={30} />
          </div>
        </Specimen>
        <Specimen name="<Logo>" usage="Top-left on every page; goes home." tone="glass">
          <Logo label={copy.brand} />
        </Specimen>
        <Specimen name="<Panel>" usage="card is a white section on the teal page (progress, subjects); glass is the frosted day-column surface.">
          <div className="grid gap-3 rounded-[16px] bg-teal-900 p-3 sm:grid-cols-2">
            <Panel title="tone=card">
              <p className="text-[14px] text-ink-soft">White, column radius, card shadow.</p>
            </Panel>
            <Panel tone="glass" title="tone=glass">
              <p className="text-[14px] text-white">White at 17% with a hairline.</p>
            </Panel>
          </div>
        </Specimen>
        <Specimen name="<EmptyState>" usage="Every list that can be empty uses this: icon, one line, one next step. tone=dark on teal.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-[#f6f9f9]">
              <EmptyState icon={<ChartColumn />} title="No study logged yet" body="Finish a focus session and it shows up here." actions={<Button size="sm">Plan a test</Button>} />
            </div>
            <div className="rounded-[16px] bg-teal-900">
              <EmptyState tone="dark" icon={<CalendarPlus />} title="Nothing planned" body="Add a session or plan for a test." actions={<Button variant="pill" size="sm">Start planning</Button>} />
            </div>
          </div>
        </Specimen>
        <Specimen tone="glass" name="<PageHeader>" usage="Title block for the inner pages, rising in with springSoft.">
          <PageHeader title="Progress" intro="How your studying is adding up." actions={<Button variant="glass" size="sm">Action</Button>} />
        </Specimen>
      </Section>

      <Section id="overlays" title="Overlays" intro="All overlays close on Escape, trap focus while open and give focus back to what opened them.">
        <Specimen name="<Dialog> · <Menu> · <Toast>" usage="Dialog for forms (bottom sheet on phones). Menu for a card's actions, arrow keys move through it. Toast confirms an action and offers Undo.">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDialog(true)}>Open dialog</Button>
            <Button ref={menuBtn} variant="secondary" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              Open menu
            </Button>
            <Button variant="secondary" onClick={() => setToast({ id: Date.now(), message: 'Deleted Flashcards', action: { label: 'Undo', run: () => {} } })}>
              Show toast
            </Button>
          </div>
          <Menu
            label="Demo menu"
            anchor={menuBtn.current}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={[
              { label: 'Edit', icon: <Pencil />, onSelect: () => {} },
              { label: 'Duplicate', icon: <Copy />, onSelect: () => {} },
              { type: 'separator' },
              { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => {} },
            ]}
          />
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            title="A dialog"
            description="Title, optional description, scrolling body, footer actions."
            footer={
              <>
                <Button variant="ghost" className="ml-auto" onClick={() => setDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDialog(false)}>Done</Button>
              </>
            }
          >
            <Field label="Something to type">
              <Input data-autofocus placeholder="Focus lands here first" />
            </Field>
            <div className="h-4" />
          </Dialog>
        </Specimen>
      </Section>

      <Section id="data" title="Data" intro="Charts follow one rule: colour repeats what a label already says. Values are always written out; hover or focus a row for detail.">
        <div className="grid gap-3.5 md:grid-cols-3">
          <StatTile label="Studied" icon={<Clock />} value="4h 20m" caption="In the last 7 days" />
          <StatTile label="Streak" icon={<Flame />} value="7 days" caption="Study today to keep it" />
          <StatTile label="Sessions done" value={12} caption="Without an icon" />
        </div>
        <Specimen name="<ProgressRing> · <ReadinessMeter>" usage="The ring shows one share; the lighter arc behind is what is planned. ReadinessMeter words it: On track (≥85% with plan), Needs more (≥50%), Behind.">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-4">
              <ProgressRing value={0.25} label="25%" />
              <ProgressRing value={0.6} secondary={0.9} label="60% done, 90% planned" />
              <ProgressRing value={1} size={56} label="Complete" />
              <ReadinessMeter variant="ring" value={demoReady} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <ReadinessMeter value={{ done: 0.6, planned: 0.95, target: 180, studied: 108 }} />
              <ReadinessMeter value={{ done: 0.3, planned: 0.6, target: 180, studied: 54 }} />
              <ReadinessMeter value={{ done: 0.1, planned: 0.2, target: 180, studied: 18 }} />
            </div>
          </div>
        </Specimen>
        <Specimen name="<BarChart> · <DayBars>" usage="BarChart: one row per subject, in the subject's colour, sorted by value. DayBars: one hue, today darker, dashed daily limit.">
          <div className="grid gap-6 md:grid-cols-2">
            <BarChart
              label="Example: minutes per subject"
              format={formatDuration}
              data={list.slice(0, 4).map((s, i) => ({ id: s.id, label: s.name, value: [140, 95, 60, 25][i]!, color: s.color, lead: <SubjectChip subject={s} size={20} /> }))}
            />
            <DayBars
              label="Example: minutes per day"
              limit={120}
              format={formatDuration}
              data={[40, 75, 0, 130, 60, 90, 45].map((v, i) => ({ date: `d${i}`, label: `Day ${i + 1}`, short: 'MTWTFSS'[i]!, value: v, today: i === 6 }))}
            />
          </div>
        </Specimen>
      </Section>

      <Section id="planner" title="Planner pieces" intro="The board's own components, live: open a card's menu, tick one off, or press play. A column over the daily limit gets the warm ring, the over pill and Rebalance.">
        <div className="grid gap-(--col-gap) md:grid-cols-3">
          <DayColumn date={today} index={0} isToday isPast={false} items={col(today)} limit={0} hot={false} actions={demoActions} onAdd={() => {}} fluid {...noDrag} />
          <DayColumn date={addDays(today, 1)} index={1} isToday={false} isPast={false} items={col(addDays(today, 1))} limit={120} hot={false} actions={demoActions} onAdd={() => {}} fluid {...noDrag} />
          <DayColumn date={addDays(today, 2)} index={2} isToday={false} isPast={false} items={[]} limit={120} hot actions={demoActions} onAdd={() => {}} fluid {...noDrag} />
        </div>
        <p className="text-[13px] text-white/85">Left: today with a session, a done session and a test with its readiness ring. Middle: overloaded. Right: empty, highlighted as a drop target.</p>
      </Section>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  )
}
