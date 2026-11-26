import { AlertTriangle, CalendarDays, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { Field, FieldGroup, Input, Segmented, SubjectPicker } from '../components/Field'
import { DurationPill } from '../components/Pill'
import { SubjectChip } from '../components/SubjectChip'
import { copy, durationOptions, totalOptions, type Item, type Settings } from '../data'
import { addDays, dayLabel, diffDays, type ISODate } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { dayLoad } from '../lib/insights'
import { buildPlan, type Plan } from '../lib/plan'
import { useSubjects } from '../lib/subjects'

export function PlanDialog({
  open,
  onClose,
  today,
  existing,
  onConfirm,
  onReset,
  items,
  settings,
}: {
  /** Current cards, to warn when the plan overfills a day. */
  items: Item[]
  settings: Settings
  open: boolean
  onClose: () => void
  today: ISODate
  /** Set when re-planning an existing test. */
  existing: Item | null
  onConfirm: (plan: Plan) => void
  onReset: () => void
}) {
  const { list, get } = useSubjects()
  const fallback = list[0]?.id ?? ''
  const [subject, setSubject] = useState(fallback)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(addDays(today, 5))
  const [total, setTotal] = useState(180)
  const [length, setLength] = useState(45)

  useEffect(() => {
    if (!open) return
    setSubject(existing?.subject ?? (list.some((x) => x.id === 'chemistry') ? 'chemistry' : fallback))
    setTitle(existing?.title ?? '')
    setDate(existing && existing.date > today ? existing.date : addDays(today, 5))
    // Only when the dialog opens; edits to the subject list mid-dialog keep the choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing, today])

  const name = get(subject).name
  const plan = useMemo(
    () => buildPlan({ subject, subjectName: name, title, testDate: date, totalMinutes: total, sessionMinutes: length, today }),
    [subject, name, title, date, total, length, today],
  )
  const overDays = useMemo(() => {
    if (!settings.dailyLimit) return 0
    return plan.days.filter((d) => {
      const extra = plan.sessions.filter((s) => s.date === d).reduce((a, s) => a + s.minutes, 0)
      const keep = existing ? items.filter((i) => !(i.testId === existing.id && !i.done)) : items
      return extra > 0 && dayLoad(keep, d) + extra > settings.dailyLimit
    }).length
  }, [plan, items, settings.dailyLimit, existing])
  const tooSoon = diffDays(date, today) < 1
  const grouped = useMemo(() => {
    const m = new Map<ISODate, Item[]>()
    for (const s of plan.sessions) m.set(s.date, [...(m.get(s.date) ?? []), s])
    return [...m.entries()]
  }, [plan])

  const confirm = () => {
    if (tooSoon) return
    if (existing) {
      plan.test.id = existing.id
      for (const s of plan.sessions) s.testId = existing.id
    }
    onConfirm(plan)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? `Re-plan ${existing.title}` : copy.planTitle}
      description={copy.planIntro}
      width={560}
      footer={
        <>
          {!existing && (
            <Button variant="link" size="sm" onClick={onReset} className="mr-auto">
              {copy.resetDemo}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className={existing ? 'ml-auto' : undefined}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={tooSoon}>
            <Sparkles />
            {existing ? 'Replace sessions' : copy.planConfirm}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          confirm()
        }}
      >
        <FieldGroup label="Subject">
          <SubjectPicker value={subject} onChange={setSubject} />
        </FieldGroup>
        <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
          <Field label="Test name">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${name} test`} />
          </Field>
          <Field label="Test date">
            <Input type="date" value={date} min={addDays(today, 1)} onChange={(e) => e.target.value && setDate(e.target.value)} required />
          </Field>
        </div>
        <FieldGroup label="Total study time" hint={formatDuration(total)}>
          <Segmented name="Total study time" value={total} options={totalOptions} onChange={setTotal} format={(v) => `${v / 60}h`} />
        </FieldGroup>
        <FieldGroup label="Session length">
          <Segmented name="Session length" value={length} options={durationOptions} onChange={setLength} format={(v) => (v < 60 ? `${v}m` : formatDuration(v))} />
        </FieldGroup>
        <button type="submit" hidden />
      </form>

      <div className="mt-5 mb-3 rounded-[2px] bg-[#f3f6f6] p-3 shadow-[inset_0_0_0_1px_#e3e9e9]">
        <p className="flex items-center gap-2 px-1 pb-2 text-[13px] font-medium text-ink-soft">
          <CalendarDays size={15} />
          {tooSoon
            ? 'Pick a test date after today.'
            : `${plan.sessions.length} sessions over ${plan.days.length} ${plan.days.length === 1 ? 'day' : 'days'}, then the test on ${dayLabel(date)}`}
        </p>
        {!tooSoon && overDays > 0 && (
          <p className="mb-2 flex items-start gap-2 rounded-[2px] bg-flag px-2.5 py-2 text-[13px] leading-[1.4] text-flag-ink">
            <AlertTriangle size={15} className="mt-px shrink-0" aria-hidden />
            {overDays} {overDays === 1 ? 'day goes' : 'days go'} over your {formatDuration(settings.dailyLimit)} daily limit. Use Rebalance on the board to spread them out.
          </p>
        )}
        <motion.ul layout className="space-y-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {grouped.map(([day, sessions]) => (
              <motion.li
                key={day + sessions.length + subject}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="flex items-center gap-3 rounded-[2px] bg-white px-2.5 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)]"
              >
                <span className="w-[52px] shrink-0 text-[13px] font-medium text-ink-soft">{dayLabel(day)}</span>
                <SubjectChip subject={subject} size={22} />
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                  {sessions
                    .map((s, i) => {
                      const t = s.title.replace(`${name} `, '')
                      return i === 0 ? t[0]!.toUpperCase() + t.slice(1) : t
                    })
                    .join(' + ')}
                </span>
                <DurationPill minutes={sessions.reduce((a, s) => a + s.minutes, 0)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </Dialog>
  )
}
