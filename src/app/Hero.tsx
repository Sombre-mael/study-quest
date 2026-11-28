import { motion, type Variants } from 'motion/react'

import { Button } from '../components/Button'
import { copy } from '../data'
import { cx } from '../lib/cx'

const rise: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 260, damping: 28, delay: 0.05 + i * 0.08 },
  }),
}

/** The reference hero. `compact` (week and month views) drops the icon and shrinks the title so the grid fits. */
export function Hero({ onStart, compact = false }: { onStart: () => void; compact?: boolean }) {
  return (
    <section
      className={cx(
        'flex flex-col items-center px-4 text-center',
        compact
          ? 'pt-[clamp(8px,2vh,20px)] pb-6'
          : 'pt-[clamp(20px,8.5vh,77px)] pb-[clamp(18px,4.1vh,37px)] max-sm:pt-5 max-sm:pb-4',
      )}
    >
      {!compact && (
        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          custom={0}
          className="border-[3px] border-[#fdf8ec] bg-[#04322f] shadow-[0_0_0_2px_#10201f,6px_6px_0_rgb(2_22_20/0.5)]"
        >
          <img
            src="/mascot-bust.png"
            alt=""
            width={104}
            height={104}
            className="pixelated block size-[clamp(64px,11vh,104px)] object-cover"
          />
        </motion.div>
      )}
      <motion.h1
        variants={rise}
        initial="hidden"
        animate="show"
        custom={1}
        className={cx(
          'font-display text-balance',
          compact
            ? 'text-[clamp(16px,2vw,24px)] leading-[1.6]'
            : 'mt-[clamp(14px,3.4vh,32px)] text-[clamp(19px,3.1vw,40px)] leading-[1.5] max-sm:mt-3.5 max-sm:text-[18px]',
        )}
      >
        {copy.headline}
      </motion.h1>
      <motion.p
        variants={rise}
        initial="hidden"
        animate="show"
        custom={2}
        className={cx(
          'mt-[14px] max-w-[38ch] text-[clamp(17px,1.4vw,19px)] leading-[1.45] text-white/85 max-sm:mt-2.5 max-sm:text-[15px] sm:max-w-none',
          compact && 'max-sm:hidden',
        )}
      >
        {copy.subcopy}
      </motion.p>
      <motion.div variants={rise} initial="hidden" animate="show" custom={3} className={compact ? 'mt-4 max-sm:mt-3' : 'mt-[22px] max-sm:mt-4'}>
        <Button variant="pill" size={compact ? 'sm' : 'lg'} onClick={onStart} className={compact ? 'px-5' : undefined}>
          {copy.cta}
        </Button>
      </motion.div>
    </section>
  )
}
