import { Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { ColorPicker, Field, FieldGroup, IconPicker, Input } from '../components/Field'
import { DurationPill } from '../components/Pill'
import { SubjectChip } from '../components/SubjectChip'
import { subjectColors, type IconKey, type Subject } from '../data'
import { slugify, useSubjects } from '../lib/subjects'

export type SubjectDraft = { mode: 'create' } | { mode: 'edit'; subject: Subject }

/** Name, colour and icon for one subject, with a live card preview. */
export function SubjectDialog({
  draft,
  usage,
  onClose,
  onSave,
  onDelete,
}: {
  draft: SubjectDraft | null
  /** How many cards use each subject, to warn before deleting. */
  usage: Map<string, number>
  onClose: () => void
  onSave: (s: Subject) => void
  onDelete: (s: Subject) => void
}) {
  const { list } = useSubjects()
  const editing = draft?.mode === 'edit' ? draft.subject : null
  const [name, setName] = useState('')
  const [color, setColor] = useState(subjectColors[0]!.value)
  const [icon, setIcon] = useState<IconKey>('book')
  const [touched, setTouched] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!draft) return
    const s = draft.mode === 'edit' ? draft.subject : null
    setName(s?.name ?? '')
    // New subjects start on the first colour nobody uses yet.
    setColor(s?.color ?? subjectColors.find((c) => !list.some((x) => x.color === c.value))?.value ?? subjectColors[0]!.value)
    setIcon(s?.icon ?? 'book')
    setTouched(false)
    setConfirming(false)
  }, [draft, list])

  const trimmed = name.trim()
  const clash = list.find((s) => s.name.toLowerCase() === trimmed.toLowerCase() && s.id !== editing?.id)
  const error = !trimmed ? 'Give the subject a name.' : clash ? `You already have ${clash.name}.` : undefined
  const preview: Subject = { id: editing?.id ?? 'preview', name: trimmed || 'New subject', color, icon }
  const count = editing ? (usage.get(editing.id) ?? 0) : 0

  const save = () => {
    setTouched(true)
    if (error) return
    let id = editing?.id ?? slugify(trimmed)
    if (!editing) while (list.some((s) => s.id === id)) id = `${id}-2`
    onSave({ id, name: trimmed, color, icon })
  }

  return (
    <Dialog
      open={!!draft}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'New subject'}
      description="Its colour and icon show on every card for this subject."
      width={540}
      footer={
        <AnimatePresence mode="wait" initial={false}>
          {confirming && editing ? (
            <motion.div key="confirm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-full flex-wrap items-center gap-2">
              <p className="mr-auto text-[13.5px] text-ink-soft" role="alert">
                {count ? `This also deletes ${count} ${count === 1 ? 'card' : 'cards'}.` : 'No cards use it.'} You can undo.
              </p>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Keep it
              </Button>
              <Button variant="danger" onClick={() => onDelete(editing)} data-autofocus>
                <Trash2 />
                Delete subject
              </Button>
            </motion.div>
          ) : (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-full flex-wrap items-center gap-2">
              {editing && (
                <Button variant="danger" onClick={() => setConfirming(true)} className="mr-auto" disabled={list.length <= 1}>
                  <Trash2 />
                  Delete
                </Button>
              )}
              <Button variant="ghost" onClick={onClose} className={editing ? undefined : 'ml-auto'}>
                Cancel
              </Button>
              <Button onClick={save}>{editing ? 'Save' : 'Add subject'}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      }
    >
      <form
        className="space-y-4 pb-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <div className="flex items-center gap-3 rounded-[2px] bg-[#f3f6f6] p-3 shadow-[inset_0_0_0_1px_#dbe2e2]" aria-hidden>
          <div className="w-[200px] rounded-card bg-card px-[11px] pt-3 pb-[13px] shadow-card">
            <motion.div key={color + icon} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }} className="inline-block">
              <SubjectChip subject={preview} />
            </motion.div>
            <p className="mt-[10px] truncate text-[15.5px] leading-5 font-medium">{preview.name} recap</p>
            <div className="mt-2">
              <DurationPill minutes={30} />
            </div>
          </div>
          <p className="text-[13px] leading-[1.45] text-ink-soft">Preview of a card</p>
        </div>
        <Field label="Name" error={touched ? error : undefined}>
          <Input data-autofocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Computer science" maxLength={32} />
        </Field>
        <FieldGroup label="Colour">
          <ColorPicker value={color} onChange={setColor} />
        </FieldGroup>
        <FieldGroup label="Icon">
          <IconPicker value={icon} color={color} onChange={setIcon} />
        </FieldGroup>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
