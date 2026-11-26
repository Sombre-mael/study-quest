import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { FieldGroup, Segmented } from '../components/Field'
import { breakOptions, dailyLimitOptions, focusOptions, type Settings } from '../data'
import { formatDuration } from '../lib/format'

/** Daily limit and the focus timer's rhythm. */
export function SettingsDialog({
  open,
  settings,
  onClose,
  onSave,
}: {
  open: boolean
  settings: Settings
  onClose: () => void
  onSave: (s: Settings) => void
}) {
  const [draft, setDraft] = useState(settings)
  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Planner settings"
      description="A daily limit flags days that hold too much. The focus timer splits sessions into blocks with breaks."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </>
      }
    >
      <div className="space-y-5 pb-3">
        <FieldGroup label="Daily limit" hint={draft.dailyLimit ? `${formatDuration(draft.dailyLimit)} a day` : 'Off'}>
          <Segmented
            name="Daily limit"
            value={draft.dailyLimit}
            options={dailyLimitOptions}
            onChange={(v) => setDraft((d) => ({ ...d, dailyLimit: v }))}
            format={(v) => (v ? formatDuration(v).replace(' min', 'm') : 'Off')}
          />
        </FieldGroup>
        <FieldGroup label="Focus block">
          <Segmented name="Focus block" value={draft.focusMinutes} options={focusOptions} onChange={(v) => setDraft((d) => ({ ...d, focusMinutes: v }))} format={(v) => `${v}m`} />
        </FieldGroup>
        <FieldGroup label="Break">
          <Segmented name="Break" value={draft.breakMinutes} options={breakOptions} onChange={(v) => setDraft((d) => ({ ...d, breakMinutes: v }))} format={(v) => `${v}m`} />
        </FieldGroup>
      </div>
    </Dialog>
  )
}
