import { Check, Compass, Flame, Gamepad2, Hourglass, Lock, Sparkles, Swords, Target, Trophy, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'

import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { SubjectChip } from '../components/SubjectChip'
import { copy, type Item, type LogEntry } from '../data'
import { cx } from '../lib/cx'
import { dayLabel, type ISODate } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { badgesFor, bossesFor, gameState, WARM_UP_DAILY_LIMIT, type BadgeIcon, type WarmUp } from '../lib/game'
import { countdown } from '../lib/insights'
import { PageShell } from './PageShell'

const badgeIcons: Record<BadgeIcon, LucideIcon> = {
  sparkles: Sparkles,
  flame: Flame,
  hourglass: Hourglass,
  trophy: Trophy,
  target: Target,
  compass: Compass,
}

/** The game side of the planner: level, today's quests, badges and the test bosses. */
export function QuestsPage({
  items,
  log,
  today,
  bonusXp,
  warmUp,
  onPlan,
  onWarmUp,
}: {
  items: Item[]
  log: LogEntry[]
  today: ISODate
  bonusXp: number
  warmUp: WarmUp
  onPlan: () => void
  onWarmUp: () => void
}) {
  const game = useMemo(() => gameState(log, today, bonusXp, warmUp), [log, today, bonusXp, warmUp])
  const badges = useMemo(() => badgesFor(items, log, today), [items, log, today])
  const bosses = useMemo(() => bossesFor(items, log, today), [items, log, today])
  const earned = badges.filter((b) => b.earned).length
  const cleared = game.quests.filter((q) => q.done).length
  const { level, streak, boost } = game

  return (
    <PageShell wide>
      <PageHeader
        title={copy.questsTitle}
        intro={copy.questsIntro}
        actions={
          <>
            <Button variant="glass" size="md" onClick={onWarmUp}>
              <Gamepad2 />
              Échauffement
            </Button>
            <Button variant="pill" size="md" onClick={onPlan} className="px-5">
              <Sparkles />
              Planifier un contrôle
            </Button>
          </>
        }
      />

      <Panel tone="glass" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="relative grid size-[76px] shrink-0 place-items-center rounded-[2px] bg-[#ffd166] text-[#10201f] shadow-[0_0_0_2px_#10201f,5px_5px_0_rgb(2_22_20/0.45)]">
            <span className="text-[9.5px] font-semibold tracking-[0.16em] uppercase">Niveau</span>
            <span className="font-display -mt-0.5 text-[22px] leading-none">{level.level}</span>
          </div>

          <div className="min-w-[160px] flex-1">
            <p className="text-[12px] font-semibold tracking-[0.14em] text-white/75 uppercase">{level.rank}</p>
            <p className="mt-0.5 text-[21px] font-bold tracking-[-0.02em] tabular-nums">
              {level.xp.toLocaleString('fr-FR')} XP
              <span className="ml-2 text-[13px] font-medium text-white/75">
                {level.into} / {level.span} avant le niveau {level.level + 1}
              </span>
            </p>
            <div
              role="meter"
              aria-label={`Progression du niveau ${level.level}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(level.ratio * 100)}
              aria-valuetext={`${level.into} XP sur ${level.span}`}
              className="mt-2 h-2.5 overflow-hidden rounded-[2px] bg-white/22"
            >
              <motion.span
                className="block h-full rounded-[2px] bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, Math.round(level.ratio * 100))}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 24 }}
              />
            </div>
            <p className="mt-1.5 text-[12.5px] text-white/80">{level.toNext} XP avant le niveau suivant</p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <MiniStat icon={Flame} label="Série" value={`${streak.days} j`} note={`bonus ×${boost}`} />
            <MiniStat icon={Check} label="Quêtes" value={`${cleared}/${game.quests.length}`} note="aujourd’hui" />
            <MiniStat icon={Trophy} label="Badges" value={`${earned}/${badges.length}`} note="obtenus" />
          </div>
        </div>
      </Panel>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.05fr_1fr]">
        <Panel title="Quêtes du jour" action={<span className="text-[13px] text-ink-soft tabular-nums">{game.questXp} XP à gagner</span>}>
          <ul className="divide-y divide-line">
            {game.quests.map((q) => {
              const pct = Math.round((q.value / q.target) * 100)
              return (
                <li key={q.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span
                      className={cx(
                        'mt-0.5 grid size-6 shrink-0 place-items-center rounded-[2px]',
                        q.done ? 'bg-teal-700 text-white' : 'bg-[#eef2f2] text-[#9aa7a6]',
                      )}
                    >
                      {q.done ? <Check size={13} strokeWidth={3} aria-hidden /> : <span className="size-1.5 rounded-[2px] bg-current" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium">
                        {q.title}
                        <span className="rounded-[2px] bg-[#eef6f5] px-2 py-px text-[11.5px] font-semibold text-teal-700">+{q.xp} XP</span>
                        {q.done && <span className="text-[12px] font-medium text-[#166534]">validée</span>}
                      </p>
                      <p className="text-[13px] text-ink-soft">{q.detail}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-[2px] bg-[#e6eded]" aria-hidden>
                        <motion.span
                          className={cx('block h-full rounded-[2px]', q.done ? 'bg-[#166534]' : 'bg-teal-700')}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                        />
                      </div>
                    </div>
                    <span className="text-[12.5px] font-medium text-ink-soft tabular-nums">
                      {q.value}/{q.target}
                      <span className="sr-only"> {q.unit}</span>
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          title="Combats de boss"
          action={<span className="text-[13px] text-ink-soft">Réviser, c’est taper</span>}
        >
          {bosses.length ? (
            <ul className="space-y-4">
              {bosses.map((b) => {
                const pct = Math.round(b.ready * 100)
                return (
                  <li key={b.id}>
                    <div className="flex items-center gap-2.5">
                      <SubjectChip subject={b.subject} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-medium">{b.title}</p>
                        <p className="text-[12.5px] text-ink-soft">
                          {dayLabel(b.date)} · {countdown(b.date, today)}
                        </p>
                      </div>
                      <span className={cx('text-[13px] font-semibold tabular-nums', pct >= 80 ? 'text-[#166534]' : pct >= 50 ? 'text-[#c2410c]' : 'text-[#b91c1c]')}>
                        {pct}%
                      </span>
                    </div>
                    <div
                      role="meter"
                      aria-label={`Préparation pour ${b.title}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-valuetext={`${pct}% prêt, ${formatDuration(b.hp)} de révision restante`}
                      className="relative mt-2 h-3 overflow-hidden rounded-[2px] bg-[#e6eded]"
                    >
                      <motion.span
                        className="absolute inset-y-0 left-0 rounded-[2px] bg-[#2fbfae] shadow-[inset_0_-2px_0_#0b8078]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, pct)}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 24 }}
                      />
                      <span aria-hidden className="pixel-stripes absolute inset-0" />
                    </div>
                    <p className="mt-1 flex justify-between text-[12px] text-ink-soft tabular-nums">
                      <span>
                        {formatDuration(b.damage)} / {formatDuration(b.maxHp)} de dégâts
                      </span>
                      <span>{b.hp > 0 ? `${formatDuration(b.hp)} PV restants` : 'Vaincu'}</span>
                    </p>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState icon={<Swords />} title="Aucun boss pour l’instant" body="Planifie un contrôle : il apparaîtra ici avec une barre de vie faite de minutes de révision." actions={<Button size="sm" onClick={onPlan}>Planifier un contrôle</Button>} />
          )}
        </Panel>
      </div>

      <Panel
        title="Badges"
        className="mt-3.5"
        action={<span className="text-[13px] text-ink-soft tabular-nums">{earned} sur {badges.length} obtenus</span>}
      >
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => {
            const Icon = badgeIcons[b.icon]
            return (
              <li
                key={b.id}
                className={cx(
                  'flex items-start gap-3 rounded-[2px] p-3',
                  b.earned ? 'bg-[#eef6f5] shadow-[inset_0_0_0_1px_#d3e8e5]' : 'bg-[#f7f9f9] shadow-[inset_0_0_0_1px_#e7eceb]',
                )}
              >
                <span className={cx('grid size-9 shrink-0 place-items-center rounded-[2px]', b.earned ? 'bg-teal-700 text-white' : 'bg-[#e6eded] text-[#8d9a99]')}>
                  <Icon size={17} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className={cx('flex items-center gap-1.5 text-[14px] font-semibold', !b.earned && 'text-ink-soft')}>
                    {b.title}
                    {!b.earned && <Lock size={12} aria-hidden className="text-[#9aa7a6]" />}
                  </p>
                  <p className="text-[12.5px] leading-4 text-ink-soft">{b.detail}</p>
                  {!b.earned && b.progress > 0 && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-[2px] bg-[#e6eded]" aria-hidden>
                      <span className="block h-full rounded-[2px] bg-[#9aa7a6]" style={{ width: `${Math.round(b.progress * 100)}%` }} />
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel tone="glass" className="mt-3.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-[2px] bg-white/14 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]">
            <Gamepad2 size={22} aria-hidden />
          </span>
          <div className="min-w-[220px] flex-1">
            <p className="text-[16px] font-semibold">Manche d’échauffement</p>
            <p className="text-[13.5px] leading-5 text-white/85">
              Un jeu de mémoire de 30 secondes avec tes matières. Termine le plateau pour gagner jusqu’à 50 XP bonus.{' '}
              {game.warmUpLeft > 0
                ? `${game.warmUpLeft} partie(s) récompensée(s) sur ${WARM_UP_DAILY_LIMIT} aujourd’hui.`
                : 'Limite atteinte — l’XP bonus revient demain.'}
            </p>
          </div>
          <Button variant="pill" size="md" onClick={onWarmUp} className="px-5">
            {game.warmUpLeft > 0 ? 'Jouer à l’échauffement' : 'Entraînement libre'}
          </Button>
        </div>
      </Panel>
    </PageShell>
  )
}

function MiniStat({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <div className="min-w-0 rounded-[2px] bg-white/12 px-2.5 py-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)] sm:min-w-[92px] sm:px-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-white/75 uppercase">
        <Icon size={12} aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 text-[19px] leading-tight font-bold tabular-nums">{value}</p>
      <p className="text-[11.5px] text-white/75">{note}</p>
    </div>
  )
}
