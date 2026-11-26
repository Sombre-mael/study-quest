import { CalendarPlus, ChartColumn, Sparkles, Timer } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '../components/Button'
import { DurationPill, TestPill } from '../components/Pill'
import { SubjectChip } from '../components/SubjectChip'
import { copy } from '../data'
import { navigate } from '../lib/router'
import { useSubjects } from '../lib/subjects'

const steps = [
  { icon: <Sparkles />, title: 'Plan a test', body: 'Pick a date; sessions spread across the days before it.' },
  { icon: <Timer />, title: 'Focus', body: 'Start a calm timer from any card. It ticks the card off.' },
  { icon: <ChartColumn />, title: 'Track', body: 'Hours per subject, your streak and how ready you are.' },
]

/** What a brand-new planner shows in place of the board. */
export function Onboarding({ onPlan, onAddToday, onSample }: { onPlan: () => void; onAddToday: () => void; onSample: () => void }) {
  const { list } = useSubjects()
  const [a, b] = [list[0], list[1] ?? list[0]]
  return (
    <section aria-labelledby="onboarding-title" className="flex flex-1 justify-center px-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        className="grid w-full max-w-[920px] items-center gap-8 rounded-column bg-column p-6 shadow-[inset_0_0_0_1px_var(--color-column-edge),inset_0_1px_0_rgb(255_255_255/0.12)] sm:p-8 md:grid-cols-[1fr_300px]"
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
              Plan your first test
            </Button>
            <Button variant="glass" size="md" onClick={onAddToday}>
              <CalendarPlus />
              Add a session today
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            <Button variant="linkDark" size="sm" onClick={() => navigate('/subjects')}>
              Set up your subjects first
            </Button>
            <Button variant="linkDark" size="sm" onClick={onSample}>
              Or load the sample plan
            </Button>
          </div>
        </div>

        {/* A little stack of the cards to come. Decorative. */}
        <div aria-hidden className="relative mx-auto hidden h-[260px] w-[280px] md:block">
          {a && (
            <motion.div
              initial={{ opacity: 0, rotate: -8, y: 20 }}
              animate={{ opacity: 1, rotate: -6, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.55 }}
              className="absolute top-2 left-0 w-[220px] rounded-card bg-card p-3 text-ink shadow-card-hover"
            >
              <SubjectChip subject={a} />
              <p className="mt-2.5 text-[15px] font-medium">{a.name} recap</p>
              <div className="mt-2">
                <DurationPill minutes={30} />
              </div>
            </motion.div>
          )}
          {b && (
            <motion.div
              initial={{ opacity: 0, rotate: 8, y: 20 }}
              animate={{ opacity: 1, rotate: 4, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.7 }}
              className="absolute top-[110px] right-0 w-[220px] rounded-card bg-card p-3 text-ink shadow-lift"
            >
              <SubjectChip subject={b} />
              <p className="mt-2.5 text-[15px] font-medium">{b.name} test</p>
              <div className="mt-2">
                <TestPill />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  )
}
