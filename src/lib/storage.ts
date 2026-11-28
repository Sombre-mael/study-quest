import { useEffect, useState } from 'react'

/**
 * localStorage is "best effort" storage: under pressure a browser may evict a
 * whole origin's data. `navigator.storage.persist()` asks Chrome, Firefox and
 * friends to keep it instead. It is a request, not a promise, so the state is
 * shown in the More menu and the export file stays the real safety net.
 */
export type StoragePersistence = 'checking' | 'persistent' | 'ephemeral' | 'unsupported'

export function useStoragePersistence(): StoragePersistence {
  const [state, setState] = useState<StoragePersistence>('checking')

  useEffect(() => {
    let live = true
    const manager = typeof navigator === 'undefined' ? undefined : navigator.storage
    if (!manager || typeof manager.persisted !== 'function') {
      setState('unsupported')
      return
    }
    void (async () => {
      try {
        const already = await manager.persisted()
        const granted = already || (typeof manager.persist === 'function' ? await manager.persist() : false)
        if (live) setState(granted ? 'persistent' : 'ephemeral')
      } catch {
        // Safari and private windows can refuse the call outright.
        if (live) setState('ephemeral')
      }
    })()
    return () => {
      live = false
    }
  }, [])

  return state
}
