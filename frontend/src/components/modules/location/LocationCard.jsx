import { Phone, Clock, MapPin, Zap, ChevronRight } from "lucide-react"
import { FeederStatusPill } from "./FeederStatusPill"
import { useState } from "react"
import { useLocation } from "@/hooks/useLocation"

const AREA_TYPE_LABELS = {
  sector:         "Sector",
  satellite_town: "Satellite Town",
  cantonment:     "Cantonment",
  rural:          "Rural Area",
}

function TodaysSchedulePreview({ schedule }) {
  if (!schedule || schedule.length === 0) {
    return (
      <p className="text-xs text-green-600 font-medium">No outages today</p>
    )
  }
  return (
    <div className="space-y-0.5">
      {schedule.slice(0, 2).map((s, i) => (
        <p key={i} className="text-xs text-slate-500 font-mono">
          {s.start_time} - {s.end_time}
          <span className="font-sans text-slate-400 ml-1">
            ({s.duration_hours}h)
          </span>
        </p>
      ))}
      {schedule.length > 2 && (
        <p className="text-xs text-slate-400">
          +{schedule.length - 2} more today
        </p>
      )}
    </div>
  )
}

function LocationDetail({ locationId }) {
  const { data, isLoading } = useLocation(locationId)

  if (isLoading) {
    return (
      <div className="pt-3 border-t border-slate-100 animate-pulse space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="pt-3 border-t border-slate-100 space-y-3">
      {data.office_address && (
        <div className="flex gap-2 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
          <span>{data.office_address}</span>
        </div>
      )}
      {data.office_hours && (
        <div className="flex gap-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
          <span>{data.office_hours}</span>
        </div>
      )}
      {data.feeders && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">
              Today's load shedding
            </span>
          </div>
          <TodaysSchedulePreview schedule={data.todays_schedule} />
        </div>
      )}
    </div>
  )
}

export function LocationCard({ location, distance }) {
  const [expanded, setExpanded] = useState(false)
  const feederStatus = location.feeders?.status

  return (
    <div
      className={[
        "bg-white rounded-xl border transition-all duration-150",
        expanded
          ? "border-iesco-teal/30 shadow-sm"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-sm">
                {location.name}
              </h3>
              <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {AREA_TYPE_LABELS[location.area_type] ?? location.area_type}
              </span>
              {distance !== undefined && (
                <span className="text-xs text-iesco-teal font-medium">
                  {distance} km away
                </span>
              )}
            </div>

            {location.office_name && (
              <p className="text-xs text-slate-500">{location.office_name}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {location.office_phone && (
                <a
                  href={"tel:" + location.office_phone}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-iesco-blue hover:underline font-mono"
                >
                  <Phone className="h-3 w-3" />
                  {location.office_phone}
                </a>
              )}
              {location.complaint_phone && location.complaint_phone !== location.office_phone && (
                <a
                  href={"tel:" + location.complaint_phone}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline font-mono"
                >
                  <Phone className="h-3 w-3" />
                  {location.complaint_phone}
                  <span className="font-sans text-red-400">(complaints)</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {feederStatus && (
              <FeederStatusPill status={feederStatus} />
            )}
            <ChevronRight
              className={[
                "h-4 w-4 text-slate-300 transition-transform",
                expanded ? "rotate-90" : "",
              ].join(" ")}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <LocationDetail locationId={location.id} />
        </div>
      )}
    </div>
  )
}
