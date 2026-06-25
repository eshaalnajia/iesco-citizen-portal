import { X, Phone, Zap, Calendar } from "lucide-react"
import { useQuery }                        from "@tanstack/react-query"
import { Skeleton }                        from "@/components/ui/skeleton"
import { FeederStatusPill }                from "@/components/modules/location/FeederStatusPill"
import api                                 from "@/services/api"

async function getFeederScheduleToday(feederId) {
  const { data } = await api.get("/schedules/feeder/" + feederId, {
    params: { days_ahead: 1 },
  })
  return data
}

async function getFeederLocation(feederId) {
  const allLocations = await api.get("/locations/", { params: { page_size: 100 } })
  return allLocations.data.data?.find((l) => l.feeder_id === feederId) ?? null
}

function SchedulePreview({ feederId }) {
  const today = new Date().toISOString().split("T")[0]

  const { data, isLoading } = useQuery({
    queryKey:  ["feeder-schedule-today", feederId],
    queryFn:   () => getFeederScheduleToday(feederId),
    staleTime: 1000 * 60 * 5,
    enabled:   !!feederId,
  })

  if (isLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  const schedules = data?.data?.filter(
    (s) => s.schedule_date === today
  ) ?? []

  if (schedules.length === 0) {
    return (
      <p className="text-xs text-green-600 font-medium">No outages scheduled today</p>
    )
  }

  return (
    <div className="space-y-1">
      {schedules.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {s.is_active && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          )}
          <span className="text-xs font-mono text-slate-600">
            {s.start_time} - {s.end_time}
          </span>
          <span className="text-xs text-slate-400">
            ({s.duration_hours}h - {s.type})
          </span>
        </div>
      ))}
    </div>
  )
}

function LocationContact({ feederId }) {
  const { data: locData, isLoading } = useQuery({
    queryKey:  ["feeder-location", feederId],
    queryFn:   () => getFeederLocation(feederId),
    staleTime: 1000 * 60 * 60,
    enabled:   !!feederId,
  })

  if (isLoading) return <Skeleton className="h-4 w-40" />
  if (!locData) return null

  return (
    <div className="space-y-1">
      {locData.office_name && (
        <p className="text-xs text-slate-500">{locData.office_name}</p>
      )}
      {locData.complaint_phone && (
        <a
        
          href={"tel:" + locData.complaint_phone}
          className="flex items-center gap-1 text-xs text-iesco-blue hover:underline font-mono"
        >
          <Phone className="h-3 w-3" />
          {locData.complaint_phone}
          <span className="font-sans text-slate-400">(complaints)</span>
        </a>
      )}
    </div>
  )
}

function ReliabilityBar({ score }) {
  const color =
    score >= 80 ? "bg-green-500" :
    score >= 60 ? "bg-amber-500" :
    "bg-red-500"

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Reliability</span>
        <span className="font-medium text-slate-700">{score ?? "-"}/100</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={"h-full rounded-full " + color}
          style={{ width: (score ?? 0) + "%" }}
        />
      </div>
    </div>
  )
}

function formatRelative(iso) {
  if (!iso) return "-"
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return "just now"
  if (mins < 60) return mins + "m ago"
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return hrs + "h ago"
  return Math.floor(hrs / 24) + "d ago"
}

export function MapFeederPopup({ feeder, onClose }) {

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 overflow-hidden"
      style={{ maxHeight: "calc(100vh - 12rem)" }}
    >
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-slate-400 font-mono">
                {feeder.feeder_code}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400">{feeder.sector}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">
              {feeder.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <FeederStatusPill status={feeder.status} />
          <span className="text-xs text-slate-400">
            Updated {formatRelative(feeder.last_updated)}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 overflow-y-auto"
           style={{ maxHeight: "calc(100vh - 20rem)" }}>

        <ReliabilityBar score={feeder.reliability} />

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Today's schedule
            </span>
          </div>
          <SchedulePreview feederId={feeder.id} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              IESCO contact
            </span>
          </div>
          <LocationContact feederId={feeder.id} />
        </div>

      </div>
    </div>
  )
}

