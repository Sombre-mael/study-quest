import { Pencil, Plus, Shapes } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'

import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { IconButton } from '../components/IconButton'
import { PageHeader } from '../components/PageHeader'
import { SubjectChip } from '../components/SubjectChip'
import { copy, type Item, type LogEntry, type Subject } from '../data'
import type { ISODate } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { useSubjects } from '../lib/subjects'
import { PageShell } from './PageShell'

/** Every subject as a card: what it looks like, what is planned, what is done. */
export function SubjectsPage({
  items,
  log,
  today,
  onAdd,
  onEdit,
}: {
  items: Item[]
  log: LogEntry[]
  today: ISODate
  onAdd: () => void
  onEdit: (s: Subject) => void
}) {
  const { list } = useSubjects()
  const stats = useMemo(() => {
    const m = new Map<string, { upcoming: number; minutes: number; tests: number; studied: number }>()
    for (const s of list) m.set(s.id, { upcoming: 0, minutes: 0, tests: 0, studied: 0 })
    for (const i of items) {
      const r = m.get(i.subject)
      if (!r || i.date < today) continue
      if (i.kind === 'test') r.tests++
      else if (!i.done) {
        r.upcoming++
        r.minutes += i.minutes
      }
    }
    for (const l of log) {
      const r = m.get(l.subject)
      if (r) r.studied += l.minutes
    }
    return m
  }, [list, items, log, today])

  return (
    <PageShell>
      <PageHeader
        title={copy.subjectsTitle}
        intro={copy.subjectsIntro}
        actions={
          <Button variant="pill" size="md" onClick={onAdd} className="px-5">
            <Plus />
            Ajouter une matière
          </Button>
        }
      />
      {list.length === 0 ? (
        <div className="rounded-column bg-column shadow-[inset_0_0_0_1px_var(--color-column-edge)]">
          <EmptyState tone="dark" icon={<Shapes />} title="Aucune matière pour l’instant" body="Ajoute les matières que tu étudies. Chacune reçoit une couleur et une icône pour ses cartes." actions={<Button variant="pill" onClick={onAdd}>Ajouter ta première matière</Button>} />
        </div>
      ) : (
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => {
            const r = stats.get(s.id)!
            return (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, delay: Math.min(i, 10) * 0.04 }}
                className="on-light group relative flex items-start gap-3.5 rounded-column bg-card p-4 text-ink shadow-card transition-shadow hover:shadow-card-hover"
              >
                <SubjectChip subject={s} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[16px] font-semibold tracking-[-0.015em]">
                    <button type="button" onClick={() => onEdit(s)} className="text-left after:absolute after:inset-0 after:rounded-column after:content-['']">
                      {s.name}
                    </button>
                  </h2>
                  <p className="mt-0.5 text-[13.5px] leading-5 text-ink-soft">
                    {r.upcoming ? `${r.upcoming} à venir · ${formatDuration(r.minutes)}` : 'Rien de prévu'}
                    {r.tests ? ` · ${r.tests} ${r.tests === 1 ? 'contrôle' : 'contrôles'}` : ''}
                  </p>
                  <p className="mt-0.5 text-[13.5px] leading-5 text-ink-soft">{r.studied ? `${formatDuration(r.studied)} révisées` : 'Aucune révision enregistrée'}</p>
                </div>
                <IconButton label={`Modifier ${s.name}`} onClick={() => onEdit(s)} className="relative z-[1] -mt-1 -mr-1.5">
                  <Pencil className="size-4!" />
                </IconButton>
              </motion.li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={onAdd}
              className="flex h-full min-h-[92px] w-full items-center justify-center gap-2 rounded-column border border-dashed border-white/40 text-[14.5px] font-medium text-white/90 transition-colors hover:border-white/70 hover:bg-white/8 hover:text-white"
            >
              <Plus size={17} aria-hidden />
              Nouvelle matière
            </button>
          </li>
        </ul>
      )}
    </PageShell>
  )
}
