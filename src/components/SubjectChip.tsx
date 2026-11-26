import { subjectIcons, type Subject } from '../data'
import { cx } from '../lib/cx'
import { inkFor, useSubjects } from '../lib/subjects'

// The coloured rounded square that starts every card. Pass a subject id (looked
// up in the live subject list) or a subject object (for previews).
export function SubjectChip({ subject, size = 31, className }: { subject: string | Subject; size?: number; className?: string }) {
  const { get } = useSubjects()
  const s = typeof subject === 'string' ? get(subject) : subject
  const Icon = subjectIcons[s.icon] ?? subjectIcons.book
  const ink = inkFor(s.color)
  return (
    <span
      className={cx('inline-grid shrink-0 place-items-center rounded-chip', className)}
      style={{ width: size, height: size, background: s.color, color: ink, borderRadius: 0 }}
      aria-hidden
    >
      <Icon size={size * 0.5} strokeWidth={2.4} fill={ink === '#111' ? 'currentColor' : 'none'} />
    </span>
  )
}
