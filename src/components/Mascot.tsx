import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { cx } from '../lib/cx'

// The mascot mostly keeps still and now and then stretches, hops or leans,
// plus a short encouraging line. CSS keyframes do the work, so the global
// "reduce motion" setting already turns all of it off.

type Gesture = 'hop' | 'sway' | 'stretch' | 'peek'

const gestureClass: Record<Gesture, string> = {
  hop: 'animate-mascot-hop',
  sway: 'animate-mascot-sway',
  stretch: 'animate-mascot-stretch',
  peek: 'animate-mascot-peek',
}
const gestures = Object.keys(gestureClass) as Gesture[]

const lines = [
  'Allez, un bloc de 25 minutes et c’est parti.',
  'Une séance cochée, une de moins.',
  'Tu avances, continue comme ça.',
  'Pense à boire un verre d’eau.',
  'La pause fait partie du travail.',
]

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function Mascot({ variant, greeting }: { variant: 'bust' | 'full'; greeting?: string }) {
  const [gesture, setGesture] = useState<Gesture | null>(null)
  const [line, setLine] = useState<string | null>(variant === 'full' ? (greeting ?? null) : null)

  useEffect(() => {
    let next = 0
    let hold = 0
    let bubble = 0
    const play = () => {
      setGesture(pick(gestures))
      hold = window.setTimeout(() => setGesture(null), 1700)
      if (variant === 'full' && Math.random() < 0.5) {
        setLine(pick(lines))
        bubble = window.setTimeout(() => setLine(null), 4200)
      }
      next = window.setTimeout(play, 8000 + Math.random() * 9000)
    }
    // The greeting gets a quiet moment to itself first.
    next = window.setTimeout(play, greeting ? 8000 : 3000)
    return () => {
      window.clearTimeout(next)
      window.clearTimeout(hold)
      window.clearTimeout(bubble)
    }
  }, [greeting, variant])

  if (variant === 'bust') {
    return (
      <img
        src="/mascot-bust.png"
        alt=""
        width={104}
        height={104}
        className={cx('pixelated block size-[clamp(64px,11vh,104px)] origin-bottom object-cover', gesture && gestureClass[gesture])}
      />
    )
  }

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {line && (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="absolute top-0 right-0 z-10 w-[188px] border-2 border-ink bg-card px-3 py-2 text-[13px] leading-[1.35] text-ink shadow-card"
          >
            {line}
          </motion.p>
        )}
      </AnimatePresence>
      <div className={cx('absolute bottom-0 left-1/2 -translate-x-1/2', gesture ? undefined : 'animate-mascot-bob')}>
        <img
          src="/mascot.png"
          alt=""
          width={124}
          height={290}
          className={cx('pixelated h-[290px] w-auto origin-bottom', gesture && gestureClass[gesture])}
        />
      </div>
    </div>
  )
}
