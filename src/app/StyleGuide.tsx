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
  ['teal-950', 'Haut de page, bouton principal pressé'],
  ['teal-900', 'Page, bouton principal, texte des pastilles'],
  ['teal-700', 'Anneaux de focus sur blanc, accents'],
  ['teal-500', 'Bas de page, barres des graphiques'],
  ['ink', 'Texte sur blanc'],
  ['ink-soft', 'Texte secondaire sur blanc (AA)'],
  ['ink-faint', 'Décoration uniquement, jamais du texte'],
  ['card', 'Cartes, dialogues, panneaux'],
  ['line', 'Filets sur blanc'],
  ['column', 'Colonne de jour dépoli (blanc 17%)'],
  ['column-edge', 'Filet de colonne'],
  ['column-hot', 'Colonne sous une carte en cours de glissement'],
  ['lavender', 'Pastille de durée'],
  ['lavender-ink', 'Texte de la pastille de durée'],
  ['flag', 'Pastille de contrôle, avertissements'],
  ['flag-ink', 'Texte de la pastille de contrôle'],
  ['today', 'Point du jour'],
  ['danger', 'Actions destructives'],
  ['success', 'Texte des éléments faits'],
  ['success-soft', 'Pastille des éléments faits'],
] as const

const typeScale = [
  { name: 'Display', cls: 'text-[69px] leading-[1.08] font-bold tracking-[-0.03em]', spec: '69 / 700 / -3%', sample: 'Study Quest' },
  { name: 'Titre de page', cls: 'text-[46px] leading-[1.08] font-bold tracking-[-0.03em]', spec: '46 / 700 / -3%', sample: 'Progression' },
  { name: 'Chiffre', cls: 'text-[30px] leading-[1.15] font-bold tracking-[-0.03em]', spec: '30 / 700', sample: '4 h 20' },
  { name: 'Section', cls: 'text-[19px] font-semibold tracking-[-0.02em]', spec: '19 / 600', sample: 'Planifier un contrôle' },
  { name: 'Chapeau', cls: 'text-[18px] leading-[1.45]', spec: '18 / 400', sample: 'Répartis tes révisions sur les jours qui précèdent chaque contrôle.' },
  { name: 'Titre de carte', cls: 'text-[15.5px] leading-5 font-medium tracking-[-0.012em]', spec: '15.5 / 500', sample: 'Annales de maths' },
  { name: 'Libellé de colonne', cls: 'text-[15px]', spec: '15 / 400', sample: 'mer. 11' },
  { name: 'Corps', cls: 'text-[14.5px]', spec: '14.5 / 400', sample: 'Causes de la 1re Guerre — trois points' },
  { name: 'Petit', cls: 'text-[13px] font-medium', spec: '13 / 500', sample: 'Temps de révision total' },
  { name: 'Micro', cls: 'text-[11px]', spec: '11 / 400', sample: 'L M M J V S D' },
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
  ['colour', 'Couleur'],
  ['type', 'Typographie'],
  ['space', 'Espace et formes'],
  ['motion', 'Mouvement'],
  ['buttons', 'Boutons'],
  ['inputs', 'Champs'],
  ['display', 'Affichage'],
  ['overlays', 'Surcouches'],
  ['data', 'Données'],
  ['planner', 'Pièces du planning'],
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
  { label: 'Repos' },
  { label: 'Survol', force: 'hover' },
  { label: 'Focus visible', force: 'focus' },
  { label: 'Pressé', force: 'active' },
  { label: 'Désactivé', disabled: true },
  { label: 'Chargement', loading: true },
]

function ButtonMatrix({ variants, dark }: { variants: ButtonVariant[]; dark?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
        <thead>
          <tr>
            <th className="w-[90px]">
              <Label dark={dark}>Variante</Label>
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
                  <Button variant={v} size="sm" forceState={s.force} disabled={s.disabled} loading={s.loading} tabIndex={-1} aria-hidden={s.label !== 'Repos' || undefined}>
                    {v === 'link' || v === 'linkDark' ? 'Réinitialiser' : 'Enregistrer'}
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
  const [glassSeg, setGlassSeg] = useState<'Jours' | 'Semaine' | 'Mois'>('Jours')
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
    { id: 'sg-1', kind: 'session', subject: sid(1), title: 'Annales de maths', subtitle: 'Sujet 2023, chronométré', minutes: 60, date: today, order: 0 },
    { id: 'sg-2', kind: 'session', subject: sid(2), title: 'Fiches', minutes: 20, date: today, order: 1, done: true },
    { id: 'sg-3', kind: 'test', subject: sid(0), title: 'Contrôle de chimie', minutes: 0, date: today, order: 2, target: 180 },
    { id: 'sg-4', kind: 'session', subject: sid(3), title: 'Plan de dissertation d’histoire', minutes: 90, date: addDays(today, 1), order: 0 },
    { id: 'sg-5', kind: 'session', subject: sid(4), title: 'Révision de biologie', minutes: 75, date: addDays(today, 1), order: 1 },
  ])
  const demoReady: Readiness = { done: 0.45, planned: 0.9, target: 180, studied: 81 }
  const demoActions: CardActions = {
    edit: (i) => setToast({ id: Date.now(), message: `Modifier ${i.title}` }),
    duplicate: (i) => setToast({ id: Date.now(), message: `Dupliquer ${i.title}` }),
    shift: (i) => setToast({ id: Date.now(), message: `Déplacer ${i.title}` }),
    toggleDone: (i) => setDemo((d) => d.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x))),
    remove: (i) => setDemo((d) => d.filter((x) => x.id !== i.id)),
    replan: (i) => setToast({ id: Date.now(), message: `Replanifier ${i.title}` }),
    focus: (i) => setToast({ id: Date.now(), message: `Concentration sur ${i.title} (ouvre le minuteur dans l’app)` }),
    warmUp: (i) => setToast({ id: Date.now(), message: `Échauffement pour ${i.title} (s’ouvre dans l’app)` }),
    rebalance: () => setToast({ id: Date.now(), message: 'Rééquilibrer déplace les dernières séances vers les jours qui ont de la place' }),
    readiness: () => demoReady,
  }
  const col = (date: string) => demo.filter((d) => d.date === date)
  const noDrag = { onDragMove: () => {}, onDrop: () => false }

  return (
    <PageShell wide>
      <PageHeader
        title={copy.styleguideTitle}
        intro="Jetons et composants de Study Quest, rendus par les composants que l’application utilise. Un seul thème : page sarcelle, cartes blanches."
      />
      <nav aria-label="Sections du guide de style" className="flex flex-wrap gap-1.5">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex h-9 items-center rounded-full bg-white/12 px-3.5 text-[13.5px] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)] transition-colors hover:bg-white/22 max-sm:h-10">
            {label}
          </a>
        ))}
      </nav>

      <Section id="colour" title="Couleur" intro="Les jetons vivent dans src/styles.css sous @theme et deviennent des utilitaires Tailwind (bg-teal-900, text-ink-soft…). Les valeurs ci-dessous sont lues en direct sur la page.">
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
        <Panel title="Couleurs des matières" action={<span className="text-[12.5px] text-ink-soft">src/data.ts · subjectColors</span>}>
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
        <Panel title="Dégradé de page">
          <div className="h-16 rounded-[12px]" style={{ background: 'linear-gradient(90deg, var(--color-teal-900) 0%, #06716b 45%, var(--color-teal-500) 100%)' }} />
          <p className="mt-2 text-[13px] text-ink-soft">teal-900 → #06716b → teal-500, de haut en bas, fixé à la fenêtre.</p>
        </Panel>
      </Section>

      <Section id="type" title="Typographie" intro="Inter partout (Google Fonts, polices de secours système). Interlettrage serré sur les grandes tailles, chiffres tabulaires partout où les durées doivent s’aligner.">
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

      <Section id="space" title="Espace et formes" intro="Les espacements suivent les écarts mesurés de la référence plutôt qu’une grille stricte de 4 px ; voici les pas utilisés.">
        <Panel title="Espacements">
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
          <Panel title="Rayons">
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
          <Panel title="Élévation">
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

      <Section id="motion" title="Mouvement" intro="Des ressorts pour tout ce qui bouge (src/app/motion.ts), des durées CSS pour la couleur et l’opacité. Tout respecte le réglage système de réduction des animations.">
        <Panel
          title="Ressorts"
          action={
            <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)}>
              <RotateCcw />
              Rejouer
            </Button>
          }
        >
          {Object.entries(motionTokens).map(([name, t]) => {
            const { use, ...transition } = t
            return <MotionDemo key={name} name={name} use={`${use} · ${transition.stiffness}/${transition.damping}`} transition={transition} run={run} />
          })}
          {(
            [
              ['duration-fast', '120ms', 'Bascules, petits fondus'],
              ['duration-base', '180ms', 'Changements de couleur et de fond'],
              ['duration-slow', '320ms', 'Fondus plus larges, écrans du minuteur'],
            ] as const
          ).map(([n, v, use]) => (
            <MotionDemo key={n} name={n} use={`${use} · ${v} ease-out`} transition={{ duration: parseInt(v) / 1000, ease: [0.22, 1, 0.36, 1] }} run={run} />
          ))}
        </Panel>
        <Panel title="Animations d’ambiance">
          <div className="flex flex-wrap items-center gap-8">
            <span className="flex items-center gap-2 text-[13px]">
              <span className="size-[6px] animate-pulse-dot rounded-full bg-today" /> pulse-dot · marqueur du jour, 2,4 s
            </span>
            <span className="flex items-center gap-2 text-[13px]">
              <span className="size-10 animate-breathe rounded-full bg-[radial-gradient(closest-side,var(--color-teal-500),transparent)]" /> breathe · minuteur, 8 s
            </span>
            <span className="flex items-center gap-2 text-[13px]">
              <span className="relative size-10 overflow-hidden rounded-full bg-teal-900">
                <span className="absolute inset-0 animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(64_196_180/0.6),transparent)]" />
              </span>
              drift · halo de page, 22 s
            </span>
          </div>
        </Panel>
      </Section>

      <Section id="buttons" title="Boutons" intro="Survol, focus et état pressé sont figés ici avec forceState pour les comparer côte à côte.">
        <Specimen name="<Button>" usage="primary pour l’action principale d’un dialogue ; secondary pour une seconde option ; ghost pour Annuler ; danger pour supprimer ; link pour une action discrète en texte sur blanc.">
          <ButtonMatrix variants={['primary', 'secondary', 'ghost', 'danger', 'link']} />
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Label>Tailles</Label>
            <Button size="xs">Très petit</Button>
            <Button size="sm">Petit</Button>
            <Button size="md">Moyen</Button>
            <Button size="lg">Grand</Button>
            <Button size="md">
              <Sparkles />
              Avec icône
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
              {loading ? 'Enregistrement…' : 'Tester le chargement'}
            </Button>
          </div>
        </Specimen>
        <Specimen tone="glass" name="<Button variant=pill | glass | linkDark>" usage="pill est le seul appel à l’action blanc sur la page sarcelle (Planifier). glass sert aux contrôles secondaires sur sarcelle. linkDark est une action en texte sur sarcelle.">
          <ButtonMatrix variants={['pill', 'glass', 'linkDark']} dark />
        </Specimen>
        <Specimen name="<IconButton>" usage="Actions en icône seule. label est obligatoire (nom accessible et infobulle). tone=light sur blanc, dark sur sarcelle. Toujours 40 px sur téléphone.">
          <div className="flex flex-wrap items-center gap-6">
            {states.slice(0, 5).map((s) => (
              <span key={s.label} className="flex flex-col items-center gap-1">
                <IconButton label={`Modifier (${s.label})`} forceState={s.force} disabled={s.disabled} tabIndex={s.label === 'Repos' ? 0 : -1}>
                  <Pencil />
                </IconButton>
                <Label>{s.label}</Label>
              </span>
            ))}
            <span className="flex flex-col items-center gap-1">
              <span className="flex items-center gap-1">
                <IconButton label="Petit" size="sm">
                  <Copy />
                </IconButton>
                <IconButton label="Moyen" size="md">
                  <Copy />
                </IconButton>
                <IconButton label="Grand" size="lg">
                  <Copy />
                </IconButton>
              </span>
              <Label>sm · md · lg</Label>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[14px] bg-teal-900 p-3">
            <IconButton tone="dark" label="Lancer">
              <Play />
            </IconButton>
            <IconButton tone="dark" label="État survolé" forceState="hover" tabIndex={-1}>
              <Play />
            </IconButton>
            <IconButton tone="dark" label="État déplié" aria-expanded tabIndex={-1}>
              <Play />
            </IconButton>
            <span className="text-[12.5px] text-white/85">tone=dark : repos, survol, déplié</span>
          </div>
        </Specimen>
      </Section>

      <Section id="inputs" title="Champs">
        <Specimen name="<Field> + <Input>" usage="Chaque champ texte tient dans un Field : libellé au-dessus, indication facultative à droite, erreur en dessous. Les erreurs posent aria-invalid et sont annoncées.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Repos" hint="Facultatif">
              <Input placeholder="Chapitre 3, questions 1 à 10" />
            </Field>
            <Field label="Focus">
              <Input forceState="focus" defaultValue="Fiche de révision" tabIndex={-1} />
            </Field>
            <Field label="Erreur" error="Donne un nom à la matière.">
              <Input defaultValue="" placeholder="ex. Informatique" />
            </Field>
            <Field label="Désactivé">
              <Input disabled defaultValue="Verrouillé" />
            </Field>
          </div>
        </Specimen>
        <Specimen name="<Segmented>" usage="Choisir une option parmi quelques-unes. Les flèches déplacent le choix. tone=glass sur sarcelle (sélecteur de vue), clair dans les dialogues.">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Durée d’une séance (clair)">
              <Segmented name="sg-length" value={seg} options={[15, 20, 30, 45, 60, 90]} onChange={setSeg} format={(v) => (v < 60 ? `${v} min` : formatDuration(v))} />
            </FieldGroup>
            <div className="rounded-[14px] bg-teal-900 p-3">
              <Label dark>Vue (glass)</Label>
              <Segmented name="sg-view" tone="glass" size="sm" value={glassSeg} options={['Jours', 'Semaine', 'Mois'] as const} onChange={setGlassSeg} className="mt-1.5" />
            </div>
          </div>
        </Specimen>
        <Specimen name="<SubjectPicker> · <ColorPicker> · <IconPicker>" usage="Groupes de boutons radio en tuiles et en pastilles. La tuile choisie reçoit l’anneau sarcelle ; les flèches passent d’une option à l’autre.">
          <div className="space-y-4">
            <FieldGroup label="Matière">
              <SubjectPicker value={subject} onChange={setSubject} />
            </FieldGroup>
            <FieldGroup label="Couleur">
              <ColorPicker value={color} onChange={setColor} />
            </FieldGroup>
            <FieldGroup label="Icône">
              <IconPicker value={icon} color={color} onChange={setIcon} />
            </FieldGroup>
          </div>
        </Specimen>
      </Section>

      <Section id="display" title="Affichage">
        <Specimen name="<SubjectChip> · <DateBadge>" usage="La pastille ouvre chaque carte de séance ; la date détachable ouvre chaque carte de contrôle. Taille via la prop size ; la couleur du glyphe est choisie pour le contraste.">
          <div className="flex flex-wrap items-end gap-4">
            {list.slice(0, 8).map((s) => (
              <SubjectChip key={s.id} subject={s} />
            ))}
            <span className="mx-2 h-8 w-px bg-line" />
            <SubjectChip subject={{ id: 'x', name: 'Perso', color, icon }} size={20} />
            <SubjectChip subject={{ id: 'x', name: 'Perso', color, icon }} size={31} />
            <SubjectChip subject={{ id: 'x', name: 'Perso', color, icon }} size={44} />
            <span className="mx-2 h-8 w-px bg-line" />
            <DateBadge date={today} size={20} />
            <DateBadge date={today} />
            <DateBadge date={today} size={44} />
          </div>
        </Specimen>
        <Specimen name="<Pill>" usage="DurationPill sur les séances (vert avec une coche une fois faite), TestPill sur les contrôles, OverPill quand un jour dépasse la limite quotidienne.">
          <div className="flex flex-wrap items-center gap-2">
            <DurationPill minutes={30} />
            <DurationPill minutes={90} />
            <DurationPill minutes={45} done />
            <TestPill />
            <OverPill minutes={30} />
          </div>
        </Specimen>
        <Specimen name="<Logo>" usage="En haut à gauche de chaque page ; ramène à l’accueil." tone="glass">
          <Logo label={copy.brand} />
        </Specimen>
        <Specimen name="<Panel>" usage="card est une section blanche sur la page sarcelle (progression, matières) ; glass est la surface dépolie des colonnes de jour.">
          <div className="grid gap-3 rounded-[16px] bg-teal-900 p-3 sm:grid-cols-2">
            <Panel title="tone=card">
              <p className="text-[14px] text-ink-soft">Blanc, rayon de colonne, ombre de carte.</p>
            </Panel>
            <Panel tone="glass" title="tone=glass">
              <p className="text-[14px] text-white">Blanc à 17% avec un filet.</p>
            </Panel>
          </div>
        </Specimen>
        <Specimen name="<EmptyState>" usage="Chaque liste pouvant être vide l’utilise : une icône, une ligne, une prochaine étape. tone=dark sur sarcelle.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-[#f6f9f9]">
              <EmptyState icon={<ChartColumn />} title="Aucune révision enregistrée" body="Termine une séance de concentration et elle apparaîtra ici." actions={<Button size="sm">Planifier un contrôle</Button>} />
            </div>
            <div className="rounded-[16px] bg-teal-900">
              <EmptyState tone="dark" icon={<CalendarPlus />} title="Rien de prévu" body="Ajoute une séance ou planifie un contrôle." actions={<Button variant="pill" size="sm">Commencer à planifier</Button>} />
            </div>
          </div>
        </Specimen>
        <Specimen tone="glass" name="<PageHeader>" usage="Bloc de titre des pages intérieures, qui monte avec springSoft.">
          <PageHeader title="Progression" intro="Comment tes révisions s’additionnent." actions={<Button variant="glass" size="sm">Action</Button>} />
        </Specimen>
      </Section>

      <Section id="overlays" title="Surcouches" intro="Toutes les surcouches se ferment avec Échap, piègent le focus tant qu’elles sont ouvertes et le rendent à l’élément qui les a ouvertes.">
        <Specimen name="<Dialog> · <Menu> · <Toast>" usage="Dialog pour les formulaires (feuille du bas sur téléphone). Menu pour les actions d’une carte, les flèches le parcourent. Toast confirme une action et propose Annuler.">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDialog(true)}>Ouvrir un dialogue</Button>
            <Button ref={menuBtn} variant="secondary" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              Ouvrir un menu
            </Button>
            <Button variant="secondary" onClick={() => setToast({ id: Date.now(), message: 'Fiches supprimées', action: { label: 'Annuler', run: () => {} } })}>
              Afficher un toast
            </Button>
          </div>
          <Menu
            label="Menu de démo"
            anchor={menuBtn.current}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={[
              { label: 'Modifier', icon: <Pencil />, onSelect: () => {} },
              { label: 'Dupliquer', icon: <Copy />, onSelect: () => {} },
              { type: 'separator' },
              { label: 'Supprimer', icon: <Trash2 />, danger: true, onSelect: () => {} },
            ]}
          />
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            title="Un dialogue"
            description="Titre, description facultative, corps défilant, actions en pied."
            footer={
              <>
                <Button variant="ghost" className="ml-auto" onClick={() => setDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setDialog(false)}>Terminé</Button>
              </>
            }
          >
            <Field label="Quelque chose à saisir">
              <Input data-autofocus placeholder="Le focus arrive ici en premier" />
            </Field>
            <div className="h-4" />
          </Dialog>
        </Specimen>
      </Section>

      <Section id="data" title="Données" intro="Les graphiques suivent une règle : la couleur répète ce qu’un libellé dit déjà. Les valeurs sont toujours écrites ; survole ou place le focus sur une ligne pour le détail.">
        <div className="grid gap-3.5 md:grid-cols-3">
          <StatTile label="Révisé" icon={<Clock />} value="4 h 20" caption="Sur les 7 derniers jours" />
          <StatTile label="Série" icon={<Flame />} value="7 jours" caption="Révise aujourd’hui pour la garder" />
          <StatTile label="Séances faites" value={12} caption="Sans icône" />
        </div>
        <Specimen name="<ProgressRing> · <ReadinessMeter>" usage="L’anneau montre une part ; l’arc plus clair derrière est ce qui est prévu. ReadinessMeter le dit en mots : Dans les temps (≥85% avec le plan), Encore un effort (≥50%), En retard.">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-4">
              <ProgressRing value={0.25} label="25%" />
              <ProgressRing value={0.6} secondary={0.9} label="60% fait, 90% prévu" />
              <ProgressRing value={1} size={56} label="Terminé" />
              <ReadinessMeter variant="ring" value={demoReady} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <ReadinessMeter value={{ done: 0.6, planned: 0.95, target: 180, studied: 108 }} />
              <ReadinessMeter value={{ done: 0.3, planned: 0.6, target: 180, studied: 54 }} />
              <ReadinessMeter value={{ done: 0.1, planned: 0.2, target: 180, studied: 18 }} />
            </div>
          </div>
        </Specimen>
        <Specimen name="<BarChart> · <DayBars>" usage="BarChart : une ligne par matière, dans la couleur de la matière, triée par valeur. DayBars : une seule teinte, aujourd’hui plus foncé, limite quotidienne en pointillés.">
          <div className="grid gap-6 md:grid-cols-2">
            <BarChart
              label="Exemple : minutes par matière"
              format={formatDuration}
              data={list.slice(0, 4).map((s, i) => ({ id: s.id, label: s.name, value: [140, 95, 60, 25][i]!, color: s.color, lead: <SubjectChip subject={s} size={20} /> }))}
            />
            <DayBars
              label="Exemple : minutes par jour"
              limit={120}
              format={formatDuration}
              data={[40, 75, 0, 130, 60, 90, 45].map((v, i) => ({ date: `d${i}`, label: `Jour ${i + 1}`, short: 'LMMJVSD'[i]!, value: v, today: i === 6 }))}
            />
          </div>
        </Specimen>
      </Section>

      <Section id="planner" title="Pièces du planning" intro="Les composants du plateau, en direct : ouvre le menu d’une carte, coche-la ou appuie sur lecture. Une colonne au-dessus de la limite quotidienne reçoit l’anneau d’alerte, la pastille « de trop » et Rééquilibrer.">
        <div className="grid gap-(--col-gap) md:grid-cols-3">
          <DayColumn date={today} index={0} isToday isPast={false} items={col(today)} limit={0} hot={false} actions={demoActions} onAdd={() => {}} fluid {...noDrag} />
          <DayColumn date={addDays(today, 1)} index={1} isToday={false} isPast={false} items={col(addDays(today, 1))} limit={120} hot={false} actions={demoActions} onAdd={() => {}} fluid {...noDrag} />
          <DayColumn date={addDays(today, 2)} index={2} isToday={false} isPast={false} items={[]} limit={120} hot actions={demoActions} onAdd={() => {}} fluid {...noDrag} />
        </div>
        <p className="text-[13px] text-white/85">Gauche : aujourd’hui avec une séance, une séance faite et un contrôle avec son anneau de préparation. Milieu : surchargé. Droite : vide, mis en évidence comme cible de dépôt.</p>
      </Section>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </PageShell>
  )
}
