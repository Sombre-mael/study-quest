import { dayOfMonth, monthShort, type ISODate } from '../lib/dates'

// A tiny tear-off calendar page: red month, bold day. Used on test cards.
export function DateBadge({ date, size = 31 }: { date: ISODate; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 flex-col items-center justify-center rounded-[2px] bg-white leading-none shadow-[inset_0_0_0_1px_#e3e7e7,0_1px_2px_rgb(0_0_0/0.06)]"
      style={{ width: size, height: size }}
    >
      <span className="text-[7px] font-bold tracking-[0.04em] text-[#c9252c]">{monthShort(date)}</span>
      <span className="mt-[1px] text-[13px] font-semibold tracking-[-0.02em] text-ink">{dayOfMonth(date)}</span>
    </span>
  )
}
