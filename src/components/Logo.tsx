import { BookOpen } from 'lucide-react'

import { Link } from '../lib/router'

export function Logo({ label }: { label: string }) {
  return (
    <Link href="/" className="inline-flex min-h-10 items-center gap-[11px] rounded-[2px] text-white">
      <BookOpen size={22} strokeWidth={2} aria-hidden />
      <span className="font-display text-[11px] leading-[1.8] whitespace-nowrap uppercase max-[420px]:sr-only">{label}</span>
    </Link>
  )
}
