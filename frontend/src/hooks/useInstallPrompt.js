import { useState, useEffect } from "react"

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [isInstalled, setIsInstalled]   = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    setIsInstalled(isStandalone)

    function handleBeforeInstall(e) {
      e.preventDefault()
      setInstallEvent(e)
    }

    function handleAppInstalled() {
      setIsInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled",        handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled",        handleAppInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!installEvent) return false
    installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    setInstallEvent(null)
    return outcome === "accepted"
  }

  return {
    canInstall: !!installEvent && !isInstalled,
    isInstalled,
    promptInstall,
  }
}
