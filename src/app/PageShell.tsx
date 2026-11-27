import type { ReactNode } from 'react'

import { Link } from '../lib/router'

/** Width, gutters and the quiet footer shared by the inner pages. */
export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <div className={`mx-auto w-full flex-1 px-[clamp(16px,2.8vw,40px)] pb-14 ${wide ? 'max-w-[1240px]' : 'max-w-[1080px]'}`}>{children}</div>
      <SiteFooter />
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="no-print relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-5 text-[13px] text-white/80">
      <span>Enregistré dans ce navigateur</span>
      <span aria-hidden>·</span>
      <Link href="/styleguide" className="inline-flex min-h-10 items-center underline decoration-white/40 underline-offset-[3px] hover:text-white">
        Guide de style
      </Link>
    </footer>
  )
}
