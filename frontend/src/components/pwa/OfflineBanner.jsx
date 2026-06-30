import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { WifiOff, Wifi }    from "lucide-react"
import { useTranslation }   from "react-i18next"

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus()
  const { t } = useTranslation()

  if (isOnline && !wasOffline) return null

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-white px-4 py-2 text-sm
                      flex items-center justify-center gap-2
                      fixed top-0 left-0 right-0 z-50">
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        <span>{t("pwa.offline")}</span>
      </div>
    )
  }

  return (
    <div className="bg-green-500 text-white px-4 py-2 text-sm
                    flex items-center justify-center gap-2
                    fixed top-0 left-0 right-0 z-50
                    animate-in slide-in-from-top duration-300">
      <Wifi className="h-4 w-4 flex-shrink-0" />
      <span>{t("pwa.backOnline")}</span>
    </div>
  )
}
