import { CalendarDays, CalendarRange, ChartColumn, Columns3, Download, Eraser, MoreHorizontal, Palette, Printer, RotateCcw, Settings2, Shapes, Swords, Upload } from 'lucide-react'
import { useRef, useState, type ReactElement } from 'react'

import { Segmented } from '../components/Field'
import { IconButton } from '../components/IconButton'
import { Logo } from '../components/Logo'
import { Menu } from '../components/Menu'
import { copy } from '../data'
import { cx } from '../lib/cx'
import type { GameState } from '../lib/game'
import { Link, navigate } from '../lib/router'
import { GameHud } from './GameHud'

export type PlannerView = 'days' | 'week' | 'month'
export const viewPaths: Record<PlannerView, string> = { days: '/', week: '/week', month: '/month' }
const viewLabels: Record<PlannerView, string> = { days: 'Jours', week: 'Semaine', month: 'Mois' }
const viewIcons: Record<PlannerView, ReactElement> = { days: <Columns3 aria-hidden />, week: <CalendarRange aria-hidden />, month: <CalendarDays aria-hidden /> }

/** Days / Week / Month. Lives in the header on wide screens, under the hero on phones. */
export function ViewSwitcher({ view, name, anchor }: { view: PlannerView; name: string; anchor?: string | null }) {
  return (
    <Segmented
      name={name}
      tone="glass"
      size="sm"
      value={view}
      options={['days', 'week', 'month'] as PlannerView[]}
      onChange={(v) => navigate(viewPaths[v] + (anchor ? `?d=${anchor}` : ''))}
      format={(v) => (
        <>
          {viewIcons[v]}
          {viewLabels[v]}
        </>
      )}
    />
  )
}

function NavLink({ href, active, icon, children }: { href: string; active: boolean; icon: ReactElement; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      aria-label={children}
      className={cx(
        'inline-flex h-9 items-center gap-1.5 rounded-[2px] px-3 text-[14px] font-medium transition-colors max-md:hidden [&_svg]:size-4',
        active ? 'bg-white/18 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]' : 'text-white/88 hover:bg-white/12 hover:text-white',
      )}
    >
      {icon}
      <span className="max-sm:sr-only">{children}</span>
    </Link>
  )
}

export function AppHeader({
  path,
  view,
  anchor,
  empty,
  game,
  onSettings,
  onFresh,
  onSample,
  onExport,
  onImport,
}: {
  path: string
  view: PlannerView | null
  anchor: string | null
  empty: boolean
  game: GameState
  onSettings: () => void
  onFresh: () => void
  onSample: () => void
  onExport: () => void
  onImport: () => void
}) {
  const more = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <header className="no-print relative z-20 flex h-[62px] shrink-0 items-center justify-between gap-3 px-[clamp(16px,2.8vw,40px)]">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Logo label={copy.brand} />
        <GameHud game={game} />
      </div>
      <nav aria-label="Navigation principale" className="flex items-center gap-1 sm:gap-1.5">
        {view && (
          <div className="mr-1.5 hidden md:block">
            <ViewSwitcher view={view} name="Vue du planning" anchor={anchor} />
          </div>
        )}
        <NavLink href="/quests" active={path === '/quests'} icon={<Swords aria-hidden />}>
          Quêtes
        </NavLink>
        <NavLink href="/stats" active={path === '/stats'} icon={<ChartColumn aria-hidden />}>
          Progression
        </NavLink>
        <NavLink href="/subjects" active={path === '/subjects'} icon={<Shapes aria-hidden />}>
          Matières
        </NavLink>
        <IconButton ref={more} tone="dark" label="Plus" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <MoreHorizontal />
        </IconButton>
        <Menu
          label="Plus"
          anchor={more.current}
          open={open}
          onClose={() => setOpen(false)}
          items={[
            { label: 'Limite quotidienne et minuteur…', icon: <Settings2 />, onSelect: onSettings },
            { label: 'Imprimer cette semaine', icon: <Printer />, onSelect: () => navigate(`/print${anchor ? `?d=${anchor}` : ''}`) },
            { label: 'Guide de style', icon: <Palette />, onSelect: () => navigate('/styleguide') },
            { type: 'separator' },
            { label: 'Exporter mes données', icon: <Download />, onSelect: onExport },
            { label: 'Importer une sauvegarde…', icon: <Upload />, onSelect: onImport },
            { type: 'separator' },
            empty
              ? { label: 'Charger le planning d’exemple', icon: <RotateCcw />, onSelect: onSample }
              : { label: 'Repartir de zéro', icon: <Eraser />, danger: true, onSelect: onFresh },
          ]}
        />
      </nav>
    </header>
  )
}
