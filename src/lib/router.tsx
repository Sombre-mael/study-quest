import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

// A tiny History-API router: the whole app is a handful of paths, so this is
// all it needs. The host serves index.html for any unknown path, so deep links
// and reloads land on the right screen.
//
// On GitHub Pages the app lives under /study-quest/, so the browser path is
// always `/study-quest/<route>`. BASE keeps the routes themselves unchanged:
// the prefix is added when writing to history and stripped when reading.

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '')

function subscribe(fn: () => void) {
  window.addEventListener('popstate', fn)
  return () => window.removeEventListener('popstate', fn)
}

const snapshot = () => window.location.pathname + window.location.search

/** '/study-quest/quests' → '/quests'. Paths outside the prefix stay as they are. */
function withoutBase(pathname: string) {
  if (!BASE) return pathname
  if (pathname === BASE) return '/'
  return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const target = BASE + to
  if (target === snapshot()) return
  if (opts.replace) window.history.replaceState(null, '', target)
  else window.history.pushState(null, '', target)
  window.dispatchEvent(new PopStateEvent('popstate'))
  if (!opts.replace && !to.startsWith('/focus')) window.scrollTo({ top: 0 })
}

export type Route = { path: string; params: URLSearchParams; segments: string[] }

export function useRoute(): Route {
  const href = useSyncExternalStore(subscribe, snapshot, snapshot)
  const url = new URL(href, 'http://x')
  const path = withoutBase(url.pathname)
  return { path, params: url.searchParams, segments: path.split('/').filter(Boolean) }
}

/** An <a> that changes route without a reload. Modifier clicks still open new tabs. */
export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={BASE + href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navigate(href)
      }}
      {...rest}
    />
  )
}
