import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}

export default function DownloadAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [hidden, setHidden] = useState(() => localStorage.getItem('sv_install_hidden') === '1')

  const deviceHint = useMemo(() => {
    const ua = navigator.userAgent || ''
    if (/iphone|ipad|ipod/i.test(ua)) {
      return 'Open Share, then Add to Home Screen.'
    }
    if (/android/i.test(ua)) {
      return 'Use Install app or Add to Home screen from your browser menu.'
    }
    return 'Use your browser install option to add SecureVault to this device.'
  }, [])

  useEffect(() => {
    setInstalled(isStandalone())

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
      setHidden(false)
      localStorage.removeItem('sv_install_hidden')
    }

    const onInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
      setShowHelp(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) {
      setShowHelp(true)
      return
    }

    installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }
    setInstallPrompt(null)
  }

  const dismiss = () => {
    setHidden(true)
    setShowHelp(false)
    localStorage.setItem('sv_install_hidden', '1')
  }

  if (installed || hidden) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        className="fixed bottom-4 right-4 z-[70] w-[min(92vw,330px)]"
      >
        <div className="rounded-lg border border-white/15 bg-vault-panel/90 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-vault-accent/20 p-2 text-vault-accent">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-vault-text">Download SecureVault</div>
              <p className="mt-1 text-xs leading-5 text-vault-muted">
                Install on laptops and phones for faster access.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md p-1 text-vault-muted transition hover:bg-white/10 hover:text-vault-text"
              aria-label="Dismiss download app prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {showHelp && (
            <p className="mt-3 rounded-md border border-vault-border bg-black/20 p-2 text-xs leading-5 text-vault-text">
              {deviceHint}
            </p>
          )}

          <button
            type="button"
            onClick={install}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-vault-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-600"
          >
            <Download className="h-4 w-4" />
            Download App
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
