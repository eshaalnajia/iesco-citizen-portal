import { useEffect, useRef }     from "react"
import { X, GripHorizontal }     from "lucide-react"
import { FeederStatusPill }       from "@/components/modules/location/FeederStatusPill"
import { RestorationBadge }       from "./RestorationBadge"
import { OutageReportButton }     from "./OutageReportButton"

export function MobileBottomSheet({
  feeder,
  restorationInfo,
  todaySchedules,
  userLocation,
  onClose,
}) {
  const sheetRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  if (!feeder) return null

  return (
    <>
      <div
        className="absolute inset-0 z-30 bg-black/20"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{ maxHeight: "75vh" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <GripHorizontal className="h-5 w-5 text-slate-300" />
        </div>

        <div className="px-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 font-mono">
                {feeder.feeder_code}
              </span>
              <span className="text-xs text-slate-300">.</span>
              <span className="text-xs text-slate-400">{feeder.sector}</span>
            </div>
            <h2 className="font-bold text-slate-900">{feeder.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4"
             style={{ maxHeight: "calc(75vh - 100px)" }}>

          <div className="flex items-center justify-between">
            <FeederStatusPill status={feeder.status} />
            <span className="text-xs text-slate-400 font-mono">
              {feeder.reliability ?? "-"}/100 reliability
            </span>
          </div>

          <RestorationBadge restorationInfo={restorationInfo} />

          {todaySchedules.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Today's schedule
              </p>
              {todaySchedules.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2"
                >
                  <span className="font-mono text-slate-700">
                    {s.start_time} - {s.end_time}
                  </span>
                  <span className="text-xs text-slate-400">
                    {s.duration_hours}h - {s.type}
                  </span>
                </div>
              ))}
            </div>
          )}

          <OutageReportButton feeder={feeder} userLocation={userLocation} />
        </div>
      </div>
    </>
  )
}
