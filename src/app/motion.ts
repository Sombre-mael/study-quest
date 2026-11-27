// Shared animation state for the board.
//
// `flight` remembers where a card was on screen just before it moved (a drag
// drop or a menu move), so the card can fly from there to its new slot even
// when it remounts in another column. `entrance` is true for the first paint
// only, so the stagger plays once and later additions just pop in.

export const flight: { id: string | null; x: number; y: number } = { id: null, x: 0, y: 0 }

export function captureFlight(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-card="${id}"]`)
  if (!el) return
  const r = el.getBoundingClientRect()
  flight.id = id
  flight.x = r.left + r.width / 2
  flight.y = r.top + r.height / 2
}

export const entrance = { active: true }
if (typeof window !== 'undefined') window.setTimeout(() => (entrance.active = false), 1600)

export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const

/** Motion tokens. The style guide plays each one. */
export const motionTokens = {
  spring: { ...spring, use: 'Cartes, colonnes, cartes déplacées, mise en page' },
  springSoft: { type: 'spring', stiffness: 260, damping: 28, mass: 1, use: 'Titres d’accueil et de page qui montent' },
  springSnappy: { type: 'spring', stiffness: 500, damping: 30, mass: 1, use: 'Survol et appui des boutons' },
  springDialog: { type: 'spring', stiffness: 380, damping: 32, mass: 1, use: 'Dialogues et feuilles' },
  springChart: { type: 'spring', stiffness: 140, damping: 24, mass: 1, use: 'Barres, anneaux et jauges qui se remplissent' },
} as const
