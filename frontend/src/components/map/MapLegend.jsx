import { STATUS_COLORS, STATUS_LABELS } from "@/lib/mapConstants"
import { useState }                      from "react"
import { ChevronDown, ChevronUp }        from "lucide-react"

export function MapLegend({ heatmap = false }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 overflow-hidden text-sm min-w-[140px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-4 w-full px-3 py-2.5 text-slate-700 font-medium hover:bg-slate-50"
      >
        <span>{heatmap ? "Reliability" : "Status"}</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        }
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-2 space-y-1.5">
          {heatmap ? (
            <>
              {[
                { color: "#22C55E", label: "Very reliable (80-100)" },
                { color: "#D97706", label: "Moderate (60-80)" },
                { color: "#F97316", label: "Unreliable (40-60)" },
                { color: "#EF4444", label: "Very unreliable (<40)" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color, opacity: 0.85 }}
                  />
                  <span className="text-slate-600 text-xs">{label}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color, opacity: 0.85 }}
                  />
                  <span className="text-slate-600 text-xs">
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
