import { useState, useEffect } from "react"
import { registerSW }          from "virtual:pwa-register"

export function usePWAUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [updateSW, setUpdateSW]         = useState(null)

  useEffect(() => {
    const updateFn = registerSW({
      onNeedRefresh() {
        setNeedsRefresh(true)
      },
      onOfflineReady() {
        console.log("App ready to work offline")
      },
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        }
      },
    })
    setUpdateSW(() => updateFn)
  }, [])

  function applyUpdate() {
    if (updateSW) {
      updateSW(true)
      setNeedsRefresh(false)
    }
  }

  return { needsRefresh, applyUpdate }
}
