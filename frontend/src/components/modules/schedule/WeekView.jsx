import { useSectorSchedule } from "@/hooks/useSchedule"
import { Skeleton }           from "@/components/ui/skeleton"
import { cn }                 from "@/lib/utils"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const TYPE_COLORS = {
  scheduled:   "bg-blue-400",
  unplanned:   "bg-red-400",
  maintenance: "bg-amber-400",
}

function getNextSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

export function WeekView({ sector }) {
  const { data, isLoading } = useSectorSchedule(sector, 7)
  const days   = getNextSevenDays()
  const byDate = data?.by_date ?? {}

  if (!sector) {
    return (
      <p className="text-sm text-slate-400 py-4">
        Select an area above to see the weekly forecast for your neighbourhood.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1,2,3,4,5,6,7].map((i) => (
          <Skeleton key={i} className="h-24 flex-1 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map((day, i) => {
          const dateKey  = day.toISOString().split("T")[0]
          const entries  = byDate[dateKey] ?? []
          const isToday  = i === 0
          const hasItems = entries.length > 0

          return (
            <div
              key={dateKey}
              className={cn(
                "flex-1 min-w-[64px] rounded-lg border p-2 text-center space-y-1.5",
                isToday
                  ? "border-iesco-teal bg-iesco-teal/5"
                  : "border-slate-200 bg-white"
              )}
            >
              <p className={cn(
                "text-xs font-medium",
                isToday ? "text-iesco-teal" : "text-slate-500"
              )}>
                {isToday ? "Today" : DAY_NAMES[day.getDay()]}
              </p>

              <p className={cn(
                "text-lg font-bold leading-none",
                isToday ? "text-iesco-teal" : "text-slate-800"
              )}>
                {day.getDate()}
              </p>

              {hasItems ? (
                <div className="space-y-0.5">
                  {entries.slice(0, 3).map((e, ei) => (
                    <div
                      key={ei}
                      className={cn(
                        "h-1 rounded-full w-full",
                        TYPE_COLORS[e.type] ?? "bg-blue-400"
                      )}
                      title={`${e.start_time}-${e.end_time}`}
                    />
                  ))}
                  <p className="text-[10px] text-slate-500 mt-1">
                    {entries.length} cut{entries.length !== 1 ? "s" : ""}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-green-500 font-medium">Clear</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Unplanned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Maintenance
        </span>
      </div>
    </div>
  )
}
