import { AlertTriangle, Zap } from "lucide-react"
import { useActiveOutages }    from "@/hooks/useSchedule"
import { useTranslation }      from "react-i18next"

export function ActiveOutageBanner() {
  const { t }               = useTranslation()
  const { data, isLoading } = useActiveOutages()
  if (isLoading || !data?.count) return null
  const count   = data.count
  const entries = data.data ?? []
  const sectors = [
    ...new Set(
      entries
        .map((e) => e.feeders?.sector)
        .filter(Boolean)
    ),
  ]
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3
                    flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">
          {t("schedule.activeNow")}
        </p>
        <p className="text-sm text-red-600 mt-0.5">
          {t("schedule.activeFeeders", { count })}
          {sectors.length > 0 && (
            <> — {sectors.join(", ")}</>
          )}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1 text-xs
                      text-red-400">
        <Zap className="h-3 w-3" />
        {t("common.live")}
      </div>
    </div>
  )
}
