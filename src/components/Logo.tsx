import { Link } from '../lib/router'

export function Logo({ label }: { label: string }) {
  return (
    <Link href="/" className="inline-flex min-h-10 items-center gap-[10px] rounded-[2px] text-white">
      <img src="/mascot-head.png" alt="" width={26} height={26} className="pixelated size-[26px] object-cover" />
      <span className="font-display text-[11px] leading-[1.8] whitespace-nowrap uppercase max-[420px]:sr-only">{label}</span>
    </Link>
  )
}
