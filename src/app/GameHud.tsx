import { Flame, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import type { GameState } from '../lib/game'
import { Link } from '../lib/router'

/**
 * The level strap in the header: level, rank, XP towards the next level and
 * the streak. Phones get a compact level chip; the whole thing opens the quest
 * log, where the numbers are spelled out.
 */
export function GameHud({ game }: { game: GameState }) {
  const { level, streak } = game
  const label = `Niveau ${level.level}, ${level.rank}. ${level.into} XP sur ${level.span} avant le niveau ${level.level + 1}. Série de ${streak.days} jours. Ouvrir le journal de quêtes.`
  return (
    <>
      <Link
        href="/quests"
        aria-label={label}
        title={`Niveau ${level.level} · ${level.into}/${level.span} XP`}
        className="hidden items-center gap-2.5 rounded-[2px] bg-white/12 py-1 pr-3 pl-1 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)] transition-colors hover:bg-white/20 max-sm:hidden md:flex"
      >
        <span className="relative grid size-8 shrink-0 place-items-center rounded-[2px] bg-[#ffd166] text-[#10201f] shadow-[inset_0_0_0_2px_#10201f]">
          <span className="font-display text-[10px] leading-none">{level.level}</span>
        </span>
        <span className="flex flex-col gap-[5px]">
          <span className="text-[10px] leading-none font-semibold tracking-[0.13em] text-white/85 uppercase">
            {level.rank} · {level.xp.toLocaleString('fr-FR')} XP
          </span>
          <span className="relative block h-2 w-[82px] overflow-hidden rounded-[2px] bg-white/20 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)]">
            <motion.span
              className="absolute inset-y-0 left-0 bg-[#ffd166]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(level.ratio * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 24 }}
            />
            <span aria-hidden className="pixel-stripes absolute inset-0" />
          </span>
        </span>
        <span className="ml-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-white/90 tabular-nums">
          <Flame size={13} aria-hidden className="text-[#ffd8a8]" />
          {streak.days}
        </span>
      </Link>

      <Link
        href="/quests"
        aria-label={label}
                className="grid size-9 shrink-0 place-items-center rounded-[2px] bg-[#ffd166] text-[#10201f] shadow-[inset_0_0_0_2px_#10201f] md:hidden">
        <span className="font-display text-[10px]">{level.level}</span>
      </Link>
    </>
  )
}

/** A short celebration when a level is crossed. */
export function LevelUpBanner({ level }: { level: { level: number; rank: string } | null }) {
  return (
    <AnimatePresence>
      {level && (
        <motion.div
          key={level.level}
          role="status"
          initial={{ opacity: 0, y: -18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="pointer-events-none fixed inset-x-0 top-[74px] z-[65] flex justify-center px-4 print:hidden"
        >
          <div className="on-light flex items-center gap-3 rounded-[2px] bg-card py-2 pr-6 pl-2 text-ink shadow-lift">
            <span className="grid size-11 place-items-center rounded-[2px] bg-[#ffd166] text-[#10201f] shadow-[inset_0_0_0_2px_#10201f]">
              <Sparkles size={20} aria-hidden />
            </span>
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.14em] text-teal-700 uppercase">Niveau supérieur</p>
              <p className="text-[15px] leading-tight font-semibold">
                Niveau {level.level} · {level.rank}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
