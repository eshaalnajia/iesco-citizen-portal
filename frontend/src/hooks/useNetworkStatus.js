import { useState, useEffect } from "react"

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 3000)
      }
    }

    function handleOffline() {
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener("online",  handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online",  handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}
