import { useTodaySchedule }  from "@/hooks/useSchedule"
import { TypeBadge }         from "./TypeBadge"
import { DurationDisplay }   from "./DurationBar"
import { LiveBadge }         from "./LiveBadge"
import { Skeleton }          from "@/components/ui/skeleton"
import { CalendarX }         from "lucide-react"
import { useTranslation }       from "react-i18next"

export function ScheduleTable({ sector }) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useTodaySchedule(sector)

  if (isLoading) return <ScheduleTableSkeleton />

  if (isError) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">{t("common.error")}</p>
      </div>
    )
  }

  const schedules = data?.data ?? []

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <CalendarX className="h-10 w-10 text-slate-300 mx-auto" />
        <p className="font-medium text-slate-600">{t("schedule.noOutages")}</p>
        <p className="text-sm text-slate-400">
          {sector
            ? t("schedule.noOutagesArea", { area: sector })
            : t("schedule.noOutages")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide pb-3 pr-4">{t("schedule.columns.area")}</th>
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide pb-3 pr-4">{t("schedule.columns.time")}</th>
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide pb-3 pr-4">{t("schedule.columns.type")}</th>
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide pb-3">{t("schedule.columns.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {schedules.map((s) => (
              <tr key={s.id} className={`${s.is_active ? "bg-red-50/40" : ""}`}>
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-800">{s.feeders?.name ?? "—"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.feeders?.sector} · {s.feeders?.feeder_code}</p>
                </td>
                <td className="py-3 pr-4">
                  <DurationDisplay
                    startTime={s.start_time}
                    endTime={s.end_time}
                    durationHours={s.duration_hours}
                  />
                  {s.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">{s.notes}</p>
                  )}
                </td>
                <td className="py-3 pr-4"><TypeBadge type={s.type} /></td>
                <td className="py-3">
                  {s.is_active ? (
                    <LiveBadge />
                  ) : (
                    <span className="text-xs text-slate-400">{t("schedule.upcoming")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {schedules.map((s) => (
          <div
            key={s.id}
            className={`rounded-lg border p-3 space-y-2 ${s.is_active ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-800 text-sm">{s.feeders?.name ?? "—"}</p>
                <p className="text-xs text-slate-400">{s.feeders?.sector} · {s.feeders?.feeder_code}</p>
              </div>
              {s.is_active ? <LiveBadge /> : <TypeBadge type={s.type} />}
            </div>
            <DurationDisplay
              startTime={s.start_time}
              endTime={s.end_time}
              durationHours={s.duration_hours}
            />
            {s.notes && (
              <p className="text-xs text-slate-400 italic">{s.notes}</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 pt-2">
        {t("schedule.outageCount", { count: schedules.length })}{sector ? ` — ${sector}` : ""}{" · "}{t("schedule.autoRefresh")}
      </p>
    </div>
  )
}

function ScheduleTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-6  w-24" />
          <Skeleton className="h-6  w-16" />
        </div>
      ))}
    </div>
  )
}


