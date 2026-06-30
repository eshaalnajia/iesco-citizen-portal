import { Clock } from "lucide-react"
import { formatRelativeTime } from "@/utils/formatters"
import { useNetworkStatus }   from "@/hooks/useNetworkStatus"
import { useTranslation }     from "react-i18next"

export function StaleDataBadge({ lastUpdated }) {
  const { isOnline } = useNetworkStatus()
  const { t } = useTranslation()

  if (isOnline || !lastUpdated) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-amber-600
                    bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="h-3 w-3" />
      {t("pwa.lastUpdated")} {formatRelativeTime(lastUpdated)}
    </div>
  )
}
