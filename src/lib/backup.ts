import { todayISO } from './dates'
import { normalizeState, type State } from './store'

// A save file is the planner's localStorage state wrapped in a small envelope,
// so a stray .json from elsewhere is rejected instead of half-imported.

const FILE_KIND = 'study-quest'
const FORMAT = 1

type Envelope = {
  app: typeof FILE_KIND
  format: number
  exportedAt: string
  state: State
}

/** The JSON written to disk: readable in a text editor, one object per line. */
export function backupText(state: State): string {
  const envelope: Envelope = { app: FILE_KIND, format: FORMAT, exportedAt: new Date().toISOString(), state }
  return `${JSON.stringify(envelope, null, 2)}\n`
}

export function backupFileName(): string {
  return `study-quest-${todayISO()}.json`
}

/** Hands the file to the browser's download flow. */
export function downloadBackup(state: State) {
  const url = URL.createObjectURL(new Blob([backupText(state)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName()
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Safari needs the URL to outlive the click for a moment.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

/** Reads a save file, wrapped or bare, and throws with a message meant for the user. */
export async function readBackup(file: File): Promise<State> {
  const raw = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Ce fichier n’est pas un fichier JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Ce fichier n’est pas une sauvegarde Study Quest.')
  const envelope = parsed as Partial<Envelope> & Partial<State>
  if (envelope.app && envelope.app !== FILE_KIND) throw new Error('Ce fichier vient d’une autre application.')
  const state = normalizeState(envelope.state ?? (envelope as Partial<State>))
  if (!state) throw new Error('Ce fichier ne contient pas de planning lisible.')
  return state
}
