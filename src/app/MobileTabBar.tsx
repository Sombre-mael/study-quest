import { ChartColumn, Columns3, Gift, Shapes, Swords } from 'lucide-react'
import type { ReactNode } from 'react'

import { cx } from '../lib/cx'
import { Link } from '../lib/router'

/**
 * The phone navigation: four destinations a thumb can reach. Wide screens
 * keep the header links, so this bar is hidden from `md` up.
 */
export function MobileTabBar({ path, chestReady }: { path: string; chestReady: boolean }) {
  const tabs: { href: string; label: string; icon: ReactNode; active: boolean }[] = [
    {
      href: '/',
      label: 'Planning',
      icon: <Columns3 />,
      active: path === '/' || path === '/week' || path === '/month' || path.startsWith('/focus/'),
    },
    { href: '/quests', label: 'Quêtes', icon: <Swords />, active: path === '/quests' },
    { href: '/stats', label: 'Progrès', icon: <ChartColumn />, active: path === '/stats' },
    { href: '/subjects', label: 'Matières', icon: <Shapes />, active: path === '/subjects' },
  ]

  return (
    <nav
      aria-label="Navigation principale"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t-2 border-[#10201f] bg-[#04332f]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-[520px] px-2">
        {tabs.map((t) => {
          // The chest is the one thing worth flagging from the bar: it is a
          // limited-time reward, and the goal itself is on the header chip.
          const chest = t.href === '/quests' && chestReady
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={t.active ? 'page' : undefined}
                aria-label={chest ? `${t.label}, coffre du jour à ouvrir` : t.label}
                className={cx(
                  'relative flex h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase transition-colors [&_svg]:size-[19px]',
                  t.active ? 'text-[#ffd166]' : 'text-white/80 hover:text-white',
                )}
              >
                {t.active && <span aria-hidden className="absolute inset-x-4 top-0 h-[3px] bg-[#ffd166]" />}
                <span className="relative">
                  {t.icon}
                  {chest && (
                    <span
                      aria-hidden
                      className="absolute -top-1.5 -right-2.5 grid size-[13px] place-items-center bg-[#ffd166] text-[#10201f] shadow-[inset_0_0_0_1px_#10201f]"
                    >
                      <Gift size={9} strokeWidth={2.5} />
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
