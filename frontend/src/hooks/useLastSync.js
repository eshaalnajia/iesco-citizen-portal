import { useState, useEffect } from "react"

export function useLastSync() {
  const [lastSync, setLastSync] = useState(
    localStorage.getItem("iesco-last-sync")
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync(localStorage.getItem("iesco-last-sync"))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return lastSync
}
