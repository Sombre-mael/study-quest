import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { Field, FieldGroup, Input, Segmented, SubjectPicker } from '../components/Field'
import { durationOptions, type Item } from '../data'
import { longDayLabel, type ISODate } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { useSubjects } from '../lib/subjects'

export type ItemDraft = { mode: 'create'; date: ISODate } | { mode: 'edit'; item: Item }

/** Create or edit one session, or edit a test. */
export function ItemDialog({
  draft,
  onClose,
  onSave,
  onDelete,
}: {
  draft: ItemDraft | null
  onClose: () => void
  onSave: (values: Pick<Item, 'subject' | 'title' | 'subtitle' | 'minutes' | 'date'>, draft: ItemDraft) => void
  onDelete: (item: Item) => void
}) {
  const editing = draft?.mode === 'edit' ? draft.item : null
  const isTest = editing?.kind === 'test'
  const { list, get } = useSubjects()
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [date, setDate] = useState('')

  useEffect(() => {
    if (!draft) return
    const it = draft.mode === 'edit' ? draft.item : null
    setSubject(it?.subject ?? (list.some((x) => x.id === 'maths') ? 'maths' : (list[0]?.id ?? '')))
    setTitle(it?.title ?? '')
    setSubtitle(it?.subtitle ?? '')
    setMinutes(it?.minutes || 30)
    setDate(it?.date ?? (draft.mode === 'create' ? draft.date : ''))
    // Reset only when a new draft opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const save = () => {
    if (!draft) return
    const fallback = isTest ? `Contrôle de ${get(subject).name}` : `Révision de ${get(subject).name}`
    onSave({ subject, title: title.trim() || fallback, subtitle: subtitle.trim() || undefined, minutes: isTest ? 0 : minutes, date }, draft)
  }

  const options = durationOptions.includes(minutes) ? durationOptions : [...durationOptions, minutes].sort((a, b) => a - b)

  return (
    <Dialog
      open={!!draft}
      onClose={onClose}
      title={editing ? (isTest ? 'Modifier le contrôle' : 'Modifier la séance') : 'Nouvelle séance'}
      description={date ? longDayLabel(date) : undefined}
      footer={
        <>
          {editing && (
            <Button variant="danger" onClick={() => onDelete(editing)} className="mr-auto">
              <Trash2 />
              Supprimer
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className={editing ? undefined : 'ml-auto'}>
            Annuler
          </Button>
          <Button onClick={save}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
        </>
      }
    >
      <form
        className="space-y-4 pb-3"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <FieldGroup label="Matière">
          <SubjectPicker value={subject} onChange={setSubject} />
        </FieldGroup>
        <Field label="Titre">
          <Input data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isTest ? `Contrôle de ${get(subject).name}` : `Révision de ${get(subject).name}`} />
        </Field>
        {!isTest && (
          <>
            <Field label="Détails" hint="Facultatif">
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Chapitre 3, questions 1 à 10" />
            </Field>
            <FieldGroup label="Durée" hint={formatDuration(minutes)}>
              <Segmented name="Durée" value={minutes} options={options} onChange={setMinutes} format={(v) => (v < 60 ? `${v} min` : formatDuration(v))} />
            </FieldGroup>
          </>
        )}
        <Field label="Jour">
          <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} required />
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
