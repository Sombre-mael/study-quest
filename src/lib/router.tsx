import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

// A tiny History-API router: the whole app is a handful of paths, so this is
// all it needs. The Worker serves index.html for any unknown path, so deep
// links and reloads land on the right screen.

function subscribe(fn: () => void) {
  window.addEventListener('popstate', fn)
  return () => window.removeEventListener('popstate', fn)
}

const snapshot = () => window.location.pathname + window.location.search

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === snapshot()) return
  if (opts.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  if (!opts.replace && !to.startsWith('/focus')) window.scrollTo({ top: 0 })
}

export type Route = { path: string; params: URLSearchParams; segments: string[] }

export function useRoute(): Route {
  const href = useSyncExternalStore(subscribe, snapshot, snapshot)
  const url = new URL(href, 'http://x')
  return { path: url.pathname, params: url.searchParams, segments: url.pathname.split('/').filter(Boolean) }
}

/** An <a> that changes route without a reload. Modifier clicks still open new tabs. */
export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
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
