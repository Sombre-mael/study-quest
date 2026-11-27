import { Check, Coffee, Pause, Play, Plus, SkipForward, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { ProgressRing } from '../components/ProgressRing'
import { SubjectChip } from '../components/SubjectChip'
import type { Item, Settings } from '../data'
import { clock, segmentsFor } from '../lib/focus'
import { formatDuration } from '../lib/format'
import { useOverlay } from '../lib/useOverlay'

const MIN = 60_000

/** A soft two-note chime when a block ends. Silent if audio is blocked. */
function chime() {
  try {
    const ctx = new AudioContext()
    ;[660, 880].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = f
      o.type = 'sine'
      const t = ctx.currentTime + i * 0.22
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.12, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 1)
    })
    window.setTimeout(() => void ctx.close(), 1600)
  } catch {
    // No audio: the screen change is enough.
  }
}

/**
 * The full-screen focus timer. It runs the session as Pomodoro blocks
 * (focus, short break, focus...) and marks the card done when the last focus
 * block ends. Leaving early keeps the minutes you focused.
 */
export function FocusTimer({
  item,
  settings,
  onComplete,
  onExit,
}: {
  item: Item
  settings: Settings
  /** Every focus block finished: mark the card done with these minutes. */
  onComplete: (focusedMinutes: number) => void
  /** Closed early (or after finishing). Minutes focused in this sitting, not yet saved. */
  onExit: (focusedMinutes: number) => void
}) {
  const segments = useMemo(() => segmentsFor(item.minutes, settings.focusMinutes, settings.breakMinutes), [item.minutes, settings.focusMinutes, settings.breakMinutes])
  const [seg, setSeg] = useState(0)
  /** Length of the current block in ms (grows with +5 min). */
  const [length, setLength] = useState(segments[0]!.minutes * MIN)
  /** Time spent in the current block before the last pause. */
  const [spent, setSpent] = useState(0)
  const [runningSince, setRunningSince] = useState<number | null>(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  /** Focus ms from finished blocks. */
  const [banked, setBanked] = useState(0)
  const [finished, setFinished] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  const current = segments[seg]!
  const elapsed = spent + (runningSince ? now - runningSince : 0)
  const left = Math.max(0, length - elapsed)
  const focusedMs = banked + (current.kind === 'focus' ? Math.min(elapsed, length) : 0)
  const focusedMinutes = Math.round(focusedMs / MIN)
  const focusBlocks = segments.filter((s) => s.kind === 'focus').length
  const focusIndex = segments.slice(0, seg + 1).filter((s) => s.kind === 'focus').length

  useEffect(() => {
    if (!runningSince || finished) return
    const t = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(t)
  }, [runningSince, finished])

  const startBlock = useCallback(
    (i: number) => {
      setSeg(i)
      setLength(segments[i]!.minutes * MIN)
      setSpent(0)
      const t = Date.now()
      setNow(t)
      setRunningSince(t)
    },
    [segments],
  )

  // A block ran out: bank it and move on, or finish.
  useEffect(() => {
    if (finished || left > 0 || !runningSince) return
    const total = banked + (current.kind === 'focus' ? length : 0)
    setBanked(total)
    chime()
    if (seg + 1 >= segments.length) {
      setFinished(true)
      setRunningSince(null)
      onComplete(Math.round(total / MIN))
    } else {
      startBlock(seg + 1)
    }
  }, [left, finished, runningSince, banked, current.kind, length, seg, segments.length, onComplete, startBlock])

  const toggle = () => {
    if (runningSince) {
      setSpent(elapsed)
      setRunningSince(null)
    } else {
      const t = Date.now()
      setNow(t)
      setRunningSince(t)
    }
  }

  const finishNow = () => {
    setBanked(focusedMs)
    setFinished(true)
    setRunningSince(null)
    onComplete(Math.max(1, focusedMinutes))
  }

  const exit = () => onExit(finished ? 0 : focusedMinutes)
  useOverlay(true, panel, exit)

  // The tab title counts down too.
  useEffect(() => {
    const before = document.title
    return () => {
      document.title = before
    }
  }, [])
  useEffect(() => {
    document.title = finished ? `Terminé · ${item.title}` : `${clock(left)} · ${current.kind === 'focus' ? 'Concentration' : 'Pause'}`
  }, [left, finished, current.kind, item.title])

  const onBreak = current.kind === 'break' && !finished
  const progress = finished ? 1 : 1 - left / length

  return createPortal(
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={`Minuteur de concentration : ${item.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto text-white"
      style={{
        background: onBreak
          ? 'radial-gradient(120% 90% at 50% 10%, #12867d 0%, #0a6a64 55%, #054b47 100%)'
          : 'radial-gradient(120% 90% at 50% 10%, #0a6f69 0%, #03524e 55%, #023a37 100%)',
        transition: 'background 1.2s var(--ease-in-out)',
      }}
    >
      {/* A slow breathing light behind the ring. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
        <div className="size-[min(90vw,720px)] animate-breathe rounded-full bg-[radial-gradient(closest-side,rgb(120_230_214/0.22),transparent)]" />
      </div>

      <div className="relative flex items-center justify-between gap-3 px-[clamp(16px,2.8vw,40px)] pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <SubjectChip subject={item.subject} size={34} />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold tracking-[-0.015em]">{item.title}</p>
            <p className="text-[13.5px] text-white/85">
              {formatDuration(item.minutes)} · {focusBlocks} {focusBlocks === 1 ? 'bloc de travail' : 'blocs de travail'}
            </p>
          </div>
        </div>
        <IconButton tone="dark" size="lg" label={finished ? 'Fermer le minuteur' : 'Quitter le minuteur'} onClick={exit}>
          <X />
        </IconButton>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="flex flex-col items-center text-center"
            >
              <ProgressRing value={1} size={168} stroke={8} color="#ffffff" track="rgb(255 255 255 / 0.18)">
                <Check size={64} strokeWidth={2.4} aria-hidden />
              </ProgressRing>
              <h1 className="mt-8 text-[clamp(30px,4vw,44px)] font-bold tracking-[-0.03em]">Séance terminée</h1>
              <p className="mt-2 max-w-[40ch] text-[16px] leading-[1.5] text-white/88" role="status">
                {item.title} est cochée. {focusedMinutes > 0 ? `${formatDuration(focusedMinutes)} de concentration enregistrées.` : ''}
              </p>
              <div className="mt-8">
                <Button variant="pill" size="lg" onClick={exit} data-autofocus>
                  Retour au planning
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col items-center">
              <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-[14px] font-medium shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]">
                {onBreak ? <Coffee size={15} aria-hidden /> : <span className="size-[7px] animate-pulse-dot rounded-full bg-white" aria-hidden />}
                {onBreak ? 'Pause · étire-toi, bois un peu d’eau' : `Concentration ${focusIndex} sur ${focusBlocks}`}
              </p>
              <ProgressRing value={progress} size={300} stroke={6} color="#ffffff" track="rgb(255 255 255 / 0.16)">
                <span className="flex flex-col items-center">
                  <span className="text-[clamp(56px,9vw,76px)] leading-none font-light tracking-[-0.04em] tabular-nums" aria-hidden>
                    {clock(left)}
                  </span>
                  <span className="mt-2 text-[14px] text-white/85">{runningSince ? (onBreak ? 'avant le prochain bloc' : 'restantes dans ce bloc') : 'En pause'}</span>
                </span>
              </ProgressRing>
              {/* Screen readers get the time once a minute, not every tick. */}
              <span className="sr-only" aria-live="polite">
                {Math.ceil(left / MIN)} minutes restantes{runningSince ? '' : ', en pause'}
              </span>

              <div className="mt-6 flex items-center gap-1.5" aria-hidden>
                {segments.map((s, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${s.kind === 'focus' ? 'w-6' : 'w-2'} ${i < seg ? 'bg-white' : i === seg ? 'bg-white/80' : 'bg-white/25'}`}
                  />
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Button variant="pill" size="lg" onClick={toggle} className="min-w-[160px] px-8" data-autofocus>
                  {runningSince ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                  {runningSince ? 'Pause' : 'Reprendre'}
                </Button>
                <Button variant="glass" size="md" onClick={() => setLength((l) => l + 5 * MIN)}>
                  <Plus />5 min
                </Button>
                {onBreak ? (
                  <Button variant="glass" size="md" onClick={() => startBlock(seg + 1)}>
                    <SkipForward />
                    Passer la pause
                  </Button>
                ) : (
                  <Button variant="glass" size="md" onClick={finishNow}>
                    <Check />
                    Terminer
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="relative pb-5 text-center text-[13px] text-white/80">Échap quitte le minuteur et garde les minutes de concentration.</p>
    </motion.div>,
    document.body,
  )
}
