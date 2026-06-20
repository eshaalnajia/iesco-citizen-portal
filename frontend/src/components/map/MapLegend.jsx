import { STATUS_COLORS, STATUS_LABELS } from "@/lib/mapConstants"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export function MapLegend() {
  const [open, setOpen] = useState(true)

  return (
    <div
      className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm
                 rounded-xl shadow-md border border-slate-200 overflow-hidden
                 text-sm"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-4 w-full
                   px-3 py-2.5 text-slate-700 font-medium hover:bg-slate-50"
      >
        <span>Feeder status</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5" />
          : <ChevronDown className="h-3.5 w-3.5" />
        }
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-slate-100 pt-2">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color, opacity: 0.85 }}
              />
              <span className="text-slate-600 text-xs">
                {STATUS_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
