import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

import { cx } from '../lib/cx'
import { chestPrizes } from '../lib/game'

/** Pixel sparks thrown out of the chest when the lid flips open. */
const SPARKS = [
  { x: -46, y: -30, size: 8, delay: 0 },
  { x: 42, y: -38, size: 6, delay: 0.04 },
  { x: -26, y: -50, size: 5, delay: 0.09 },
  { x: 22, y: -54, size: 8, delay: 0.02 },
  { x: 54, y: -16, size: 5, delay: 0.12 },
  { x: -54, y: -8, size: 6, delay: 0.07 },
]

/** When the lid opens and when the amount stops rolling. */
const LID_AT = 300
const SETTLE_AT = 950
const CLOSE_AT = 2900

/**
 * The chest does not pay in silence: the lid flips open over a short roll of
 * the prize table, then lands on the day's amount. It is presentation only —
 * the XP is already in the reducer when this mounts — and any click, Escape or
 * the end of the timeline closes it.
 */
export function ChestReveal({ prize, onDone }: { prize: number | null; onDone: () => void }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (prize == null) return
    setShown(chestPrizes[0]!)
    let flick = 0
    const timers: number[] = []
    if (reduce) {
      setOpen(true)
      setShown(prize)
    } else {
      timers.push(window.setTimeout(() => setOpen(true), LID_AT))
      flick = window.setInterval(() => setShown(chestPrizes[Math.floor(Math.random() * chestPrizes.length)]!), 70)
      timers.push(
        window.setTimeout(() => {
          window.clearInterval(flick)
          flick = 0
          setShown(prize)
        }, SETTLE_AT),
      )
    }
    timers.push(window.setTimeout(onDone, reduce ? 1500 : CLOSE_AT))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      if (flick) window.clearInterval(flick)
      for (const t of timers) window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [prize, reduce, onDone])

  const settled = open && shown === prize

  if (prize == null) return null

  return (
    <motion.div
      role="status"
      aria-live="assertive"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.14 }}
      onClick={onDone}
      className="fixed inset-0 z-[70] grid place-items-center bg-[#012c29]/72 p-6 backdrop-blur-[2px] print:hidden"
    >
      <motion.div
        initial={{ scale: 0.88, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        className="on-light relative w-full max-w-[340px] rounded-[2px] bg-card px-6 pt-6 pb-5 text-center text-ink shadow-lift"
      >
        <p className="text-[10px] font-semibold tracking-[0.18em] text-teal-700 uppercase">Coffre du jour</p>

        <div aria-hidden className="relative mx-auto mt-5 h-[92px] w-[120px]">
          {/* Warm glow under the chest, brighter once the lid is up. */}
          <motion.span
            className="absolute -inset-8 block"
            style={{ background: 'radial-gradient(circle, #ffd166 0%, rgb(255 209 102 / 0.32) 45%, transparent 72%)' }}
            initial={false}
            animate={{ opacity: open ? 1 : 0.3, scale: open ? 1 : 0.7 }}
            transition={{ duration: 0.35 }}
          />

          {open &&
            !reduce &&
            SPARKS.map((s, i) => (
              <motion.span
                key={i}
                className="absolute top-[34px] left-1/2 bg-[#ffd166] shadow-[0_0_0_1px_#10201f]"
                style={{ width: s.size, height: s.size }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.6, delay: s.delay, ease: 'easeOut' }}
              />
            ))}

          {/* Body: two chunky bands over a hard ink frame. */}
          <span className="absolute bottom-0 left-0 block h-[52px] w-full bg-[#a06a35] shadow-[inset_0_0_0_2px_#10201f]">
            <span className="absolute inset-x-0 bottom-0 h-[10px] bg-[#7b4d22]" />
            <span className="absolute inset-y-0 left-1/2 w-[14px] -translate-x-1/2 bg-[#ffd166] shadow-[inset_0_0_0_2px_#10201f]" />
            <span className="absolute inset-0 block bg-[repeating-linear-gradient(90deg,transparent_0_7px,rgb(60_32_10/0.28)_7px_9px)]" />
          </span>

          {/* Lid, hinged at its base so it flips away from the viewer. */}
          <motion.span
            className="absolute top-0 left-0 block h-[30px] w-full bg-[#b4763c] shadow-[inset_0_0_0_2px_#10201f]"
            style={{ transformOrigin: 'bottom', transformPerspective: 260 }}
            initial={false}
            animate={{ rotateX: open ? -102 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <span className="absolute inset-x-0 top-1/2 h-[9px] -translate-y-1/2 bg-[#ffd166] shadow-[inset_0_0_0_2px_#10201f]" />
          </motion.span>

          {/* Lock plate, under the bands' centre seam. */}
          <span className="absolute bottom-[28px] left-1/2 block size-[14px] -translate-x-1/2 bg-[#ffd166] shadow-[inset_0_0_0_2px_#10201f]">
            <span className="absolute inset-[4px] block bg-[#10201f]" />
          </span>

          {settled && !reduce && (
            <motion.span
              className="absolute inset-[-10px] block border-2 border-[#fff3c4]"
              initial={{ opacity: 0.9, scale: 0.7 }}
              animate={{ opacity: 0, scale: 1.35 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </div>

        <motion.p
          key={shown}
          initial={settled ? { scale: 1.28 } : { scale: 0.96, opacity: 0.75 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 480, damping: 20 }}
          className={cx('font-display mt-6 text-[26px] leading-none tabular-nums', settled ? 'text-[#166534]' : 'text-ink')}
        >
          +{shown} XP
        </motion.p>

        <p className="mt-3 text-[13px] leading-[1.45] text-ink-soft">
          {settled ? `Bonus du jour versé · +${prize} XP` : 'Le coffre s’ouvre…'}
        </p>

        <p className="mt-1 text-[11.5px] text-ink-faint">Un coffre par jour. Reviens demain.</p>
      </motion.div>
    </motion.div>
  )
}
