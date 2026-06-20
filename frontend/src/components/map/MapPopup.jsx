import { X } from "lucide-react"
import { FeederStatusBadge } from "./FeederStatusBadge"

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function MapPopup({ feeder, onClose }) {
  if (!feeder) return null

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10
                 bg-white rounded-xl shadow-xl border border-slate-200
                 w-72 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-400 font-mono">{feeder.feeder_code}</p>
          <h3 className="font-semibold text-slate-900 leading-tight">
            {feeder.name}
          </h3>
          <p className="text-xs text-slate-500">{feeder.sector} sector</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0 mt-0.5"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Current status</span>
        <FeederStatusBadge status={feeder.status} />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Reliability score</span>
          <span className="font-medium text-slate-700">
            {feeder.reliability ?? "—"} / 100
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width:      `${feeder.reliability ?? 0}%`,
              background: feeder.reliability > 80
                ? "#22C55E"
                : feeder.reliability > 60
                  ? "#D97706"
                  : "#EF4444",
            }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Last updated: {formatDate(feeder.last_updated)}
      </p>
    </div>
  )
}
