import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { FieldGroup, Segmented } from '../components/Field'
import { breakOptions, dailyGoalOptions, dailyLimitOptions, focusOptions, type Settings } from '../data'
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
      title="Réglages du planning"
      description="Une limite quotidienne signale les journées trop chargées ; l’objectif du jour débloque le coffre. Le minuteur découpe chaque séance en blocs avec des pauses."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Annuler
          </Button>
          <Button onClick={() => onSave(draft)}>Enregistrer</Button>
        </>
      }
    >
      <div className="space-y-5 pb-3">
        <FieldGroup label="Limite quotidienne" hint={draft.dailyLimit ? `${formatDuration(draft.dailyLimit)} par jour` : 'Désactivée'}>
          <Segmented
            name="Limite quotidienne"
            value={draft.dailyLimit}
            options={dailyLimitOptions}
            onChange={(v) => setDraft((d) => ({ ...d, dailyLimit: v }))}
            format={(v) => (v ? formatDuration(v).replace(' min', ' min') : 'Aucune')}
          />
        </FieldGroup>
        <FieldGroup label="Objectif du jour" hint="Atteindre cet objectif débloque le coffre du jour">
          <Segmented name="Objectif du jour" value={draft.dailyGoal} options={dailyGoalOptions} onChange={(v) => setDraft((d) => ({ ...d, dailyGoal: v }))} format={(v) => `${v} min`} />
        </FieldGroup>
        <FieldGroup label="Bloc de concentration">
          <Segmented name="Bloc de concentration" value={draft.focusMinutes} options={focusOptions} onChange={(v) => setDraft((d) => ({ ...d, focusMinutes: v }))} format={(v) => `${v} min`} />
        </FieldGroup>
        <FieldGroup label="Pause">
          <Segmented name="Pause" value={draft.breakMinutes} options={breakOptions} onChange={(v) => setDraft((d) => ({ ...d, breakMinutes: v }))} format={(v) => `${v} min`} />
        </FieldGroup>
      </div>
    </Dialog>
  )
}
