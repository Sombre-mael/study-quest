import { CalendarPlus, ChartColumn, Sparkles, Timer } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '../components/Button'
import { copy } from '../data'
import { navigate } from '../lib/router'

const steps = [
  { icon: <Sparkles />, title: 'Planifie un contrôle', body: 'Choisis une date ; les séances se répartissent sur les jours d’avant.' },
  { icon: <Timer />, title: 'Concentre-toi', body: 'Lance un minuteur depuis n’importe quelle carte. Elle se coche à la fin.' },
  { icon: <ChartColumn />, title: 'Suis tes progrès', body: 'Heures par matière, ta série et ton niveau de préparation.' },
]

/** What a brand-new planner shows in place of the board. */
export function Onboarding({ onPlan, onAddToday, onSample }: { onPlan: () => void; onAddToday: () => void; onSample: () => void }) {
  return (
    <section aria-labelledby="onboarding-title" className="flex flex-1 justify-center px-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        className="grid w-full max-w-[920px] items-center gap-8 rounded-column bg-column p-6 shadow-[inset_0_0_0_1px_var(--color-column-edge),inset_0_1px_0_rgb(255_255_255/0.12)] sm:p-8 md:grid-cols-[1fr_280px]"
      >
        <div>
          <h2 id="onboarding-title" className="text-[clamp(24px,2.4vw,30px)] leading-[1.15] font-bold tracking-[-0.025em]">
            {copy.onboardingTitle}
          </h2>
          <p className="mt-2 max-w-[48ch] text-[15.5px] leading-[1.5] text-white/88">{copy.onboardingBody}</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3 sm:flex-col sm:gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-chip bg-white/14 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] [&_svg]:size-[18px]">
                  {s.icon}
                </span>
                <span>
                  <span className="block text-[14.5px] font-semibold">
                    {i + 1}. {s.title}
                  </span>
                  <span className="block text-[13.5px] leading-[1.45] text-white/85">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Button variant="pill" size="md" onClick={onPlan} className="px-5">
              <Sparkles />
              Planifie ton premier contrôle
            </Button>
            <Button variant="glass" size="md" onClick={onAddToday}>
              <CalendarPlus />
              Ajouter une séance aujourd’hui
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            <Button variant="linkDark" size="sm" onClick={() => navigate('/subjects')}>
              Commence par tes matières
            </Button>
            <Button variant="linkDark" size="sm" onClick={onSample}>
              Ou charge le planning d’exemple
            </Button>
          </div>
        </div>

        {/* Your companion for the quest. Decorative: the same words are above. */}
        <div aria-hidden className="relative mx-auto hidden h-[300px] w-[280px] md:block">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.6 }}
            className="absolute top-0 right-0 z-10 w-[188px] border-2 border-ink bg-card px-3 py-2 text-[13px] leading-[1.35] text-ink shadow-card"
          >
            Prêt ? On commence par ton prochain contrôle.
          </motion.div>
          <motion.img
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.5 }}
            src="/mascot.png"
            alt=""
            width={124}
            height={300}
            className="pixelated absolute bottom-0 left-1/2 h-[290px] w-auto -translate-x-1/2"
          />
        </div>
      </motion.div>
    </section>
  )
}
