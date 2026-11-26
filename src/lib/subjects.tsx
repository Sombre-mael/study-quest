import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { missingSubject, type Subject } from '../data'

// Subjects are user data (the subjects page edits them), so cards look them up
// through this context instead of importing a fixed list.

type Lookup = { list: Subject[]; get: (id: string) => Subject }

const SubjectsContext = createContext<Lookup>({ list: [], get: () => missingSubject })

export function SubjectsProvider({ subjects, children }: { subjects: Subject[]; children: ReactNode }) {
  const value = useMemo(() => {
    const byId = new Map(subjects.map((s) => [s.id, s]))
    return { list: subjects, get: (id: string) => byId.get(id) ?? missingSubject }
  }, [subjects])
  return <SubjectsContext.Provider value={value}>{children}</SubjectsContext.Provider>
}

export function useSubjects() {
  return useContext(SubjectsContext)
}

/** Dark glyph on light chips, white on everything else. */
export function inkFor(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const lum = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
  return lum > 0.45 ? '#111' : '#fff'
}

export function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'subject'
}
