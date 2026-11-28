import { Download, Share, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '../components/Button'

// Chrome and friends fire this once the app meets the install criteria; iOS
// Safari has no such event and needs the manual "share → home screen" hint.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const DISMISSED = 'study-planner:install-dismissed'

function runningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document)
}

/** Offers to install the app, once, and remembers being waved away. */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (runningStandalone()) return
    try {
      if (localStorage.getItem(DISMISSED)) return
    } catch {
      // Storage blocked: offer the install anyway, it just may repeat.
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as InstallEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    // Phones without the event (iOS) get the manual instructions instead.
    if (isIos()) {
      setIos(true)
      setVisible(true)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED, '1')
    } catch {
      // Storage blocked: nothing to remember it with.
    }
  }, [])

  const install = useCallback(async () => {
    if (!event) return
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'accepted') setVisible(false)
    else dismiss()
  }, [dismiss, event])

  if (!visible) return null

  return (
    <div className="no-print fixed inset-x-3 bottom-[calc(70px_+_env(safe-area-inset-bottom))] z-40 md:bottom-4">
      <div
        role="dialog"
        aria-label="Installer Study Quest"
        className="mx-auto flex max-w-[560px] items-start gap-3 rounded-card bg-column px-4 py-3 text-white shadow-[inset_0_0_0_1px_var(--color-column-edge),0_18px_40px_rgb(0_0_0/0.35)]"
      >
        <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-chip bg-white/14 [&_svg]:size-[18px]">
          {ios ? <Share /> : <Download />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold">Installer Study Quest</p>
          <p className="mt-0.5 text-[13px] leading-[1.4] text-white/85">
            {ios
              ? 'Appuie sur Partager, puis « Sur l’écran d’accueil » : l’app s’ouvre en plein écran et marche hors connexion.'
              : 'L’app s’installe sur ton écran d’accueil, s’ouvre en plein écran et marche hors connexion.'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {!ios && (
              <Button variant="pill" size="sm" onClick={install}>
                Installer
              </Button>
            )}
            <Button variant="linkDark" size="sm" onClick={dismiss}>
              Plus tard
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/12 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
