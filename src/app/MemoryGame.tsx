import { Sparkles, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { SubjectChip } from '../components/SubjectChip'
import { cx } from '../lib/cx'
import { WARM_UP_DAILY_LIMIT, warmUpDeck, warmUpReward } from '../lib/game'
import { useSubjects } from '../lib/subjects'

/**
 * The warm-up mini-game: flip cards two at a time and match the subjects.
 * Clearing it banks bonus XP — fewer moves, more XP. It is a small interactive
 * break between sessions rather than a revision quiz, so it works for any
 * subject without writing question banks.
 */
export function MemoryGame({
  open,
  onClose,
  onReward,
  subjectPool,
  playsLeft,
}: {
  open: boolean
  onClose: () => void
  onReward: (xp: number) => void
  /** Subject ids, most recently studied first. */
  subjectPool: string[]
  /** Paid games left today; at 0 the board is practice only. */
  playsLeft: number
}) {
  const { get } = useSubjects()
  const [round, setRound] = useState(0)
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [award, setAward] = useState<number | null>(null)
  const awarded = useRef(false)

  const deck = useMemo(() => warmUpDeck(subjectPool), [subjectPool, round])
  const pairs = deck.length / 2
  const won = deck.length > 0 && matched.length === deck.length

  // Every time the dialog opens, deal a fresh board.
  useEffect(() => {
    if (!open) return
    setRound((r) => r + 1)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setAward(null)
    awarded.current = false
  }, [open])

  // Two cards up: hold them for a beat, then match or turn them back.
  useEffect(() => {
    if (flipped.length !== 2) return
    const [a, b] = flipped as [number, number]
    const t = window.setTimeout(() => {
      if (a !== b && deck[a] === deck[b]) setMatched((m) => [...m, a, b])
      setFlipped([])
    }, 640)
    return () => window.clearTimeout(t)
  }, [flipped, deck])

  // Board cleared: pay out once, if today's allowance has room left.
  useEffect(() => {
    if (!won || awarded.current) return
    awarded.current = true
    if (playsLeft <= 0) {
      setAward(0)
      return
    }
    const xp = warmUpReward(moves, pairs)
    setAward(xp)
    onReward(xp)
  }, [won, moves, pairs, onReward, playsLeft])

  const flip = (i: number) => {
    if (flipped.length >= 2 || flipped.includes(i) || matched.includes(i)) return
    if (flipped.length === 1) setMoves((m) => m + 1)
    setFlipped((f) => [...f, i])
  }

  const again = () => {
    setRound((r) => r + 1)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setAward(null)
    awarded.current = false
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Warm-up: match the pairs"
      description={
        playsLeft > 0
          ? `Flip two cards at a time. Clear the board for bonus XP — the fewer moves, the more XP. ${playsLeft} of ${WARM_UP_DAILY_LIMIT} paid games left today.`
          : `Daily limit reached: you have played ${WARM_UP_DAILY_LIMIT} paid warm-ups today. Play for fun — bonus XP resumes tomorrow.`
      }
      width={520}
      footer={
        <>
          <span className="text-[13px] text-ink-soft tabular-nums">
            {moves} {moves === 1 ? 'move' : 'moves'} · {matched.length / 2} of {pairs} pairs
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={again}>
              Restart
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </>
      }
    >
      {won ? (
        <div className="flex flex-col items-center py-6 text-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="grid size-16 place-items-center rounded-[2px] bg-[#e3f5ec] text-[#166534]"
          >
            <Trophy size={28} aria-hidden />
          </motion.span>
          <h3 className="mt-4 text-[22px] font-bold tracking-[-0.02em]">Board cleared</h3>
          <p className="mt-1 text-[14px] text-ink-soft">
            {moves} moves for {pairs} pairs.
          </p>
          {award === 0 ? (
            <p className="mt-3 rounded-[2px] bg-[#fff4e5] px-4 py-1.5 text-[13.5px] font-medium text-[#c2410c]">
              Daily limit reached — no XP this round.
            </p>
          ) : award ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-[2px] bg-[#eef6f5] px-4 py-1.5 text-[15px] font-semibold text-teal-700">
              <Sparkles size={16} aria-hidden />+{award} XP
            </p>
          ) : null}
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={again}>
              Play again
            </Button>
            <Button onClick={onClose}>Back to planning</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 py-1" role="group" aria-label="Memory cards">
          {deck.map((subjectId, i) => {
            const up = flipped.includes(i) || matched.includes(i)
            const hit = matched.includes(i)
            const subject = get(subjectId)
            return (
              <motion.button
                key={`${round}-${i}`}
                type="button"
                onClick={() => flip(i)}
                disabled={hit}
                aria-label={up ? `${subject.name}${hit ? ', matched' : ''}` : `Face-down card ${i + 1}`}
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30, delay: i * 0.03 }}
                whileTap={hit ? undefined : { scale: 0.94 }}
                className={cx(
                  'grid aspect-square place-items-center rounded-[2px] transition-colors duration-150',
                  hit
                    ? 'bg-[#e3f5ec] shadow-[inset_0_0_0_1.5px_#a7dbc4]'
                    : up
                      ? 'bg-white shadow-[inset_0_0_0_1px_#dbe2e2]'
                      : 'bg-[#f3f6f6] shadow-[inset_0_0_0_1px_#dbe2e2] hover:bg-[#eaf0ef]',
                )}
              >
                {up ? <SubjectChip subject={subject} size={44} /> : <Sparkles size={20} className="text-[#9aa7a6]" aria-hidden />}
              </motion.button>
            )
          })}
        </div>
      )}
    </Dialog>
  )
}
