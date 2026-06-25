import { Locate, Layers, Map, Loader2 } from "lucide-react"
import { Button }                        from "@/components/ui/button"
import { cn }                            from "@/lib/utils"
import { FEEDER_ZOOM }                   from "@/lib/mapConstants"

export function MapControls({
  map,
  style,
  onToggleStyle,
  heatmap,
  onToggleHeatmap,
  loading,
  feederCount,
}) {
  function handleGPS() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom:   FEEDER_ZOOM,
          speed:  1.4,
        })
      },
      () => alert("Location permission denied or unavailable.")
    )
  }

  return (
    <>
      {!loading && feederCount > 0 && (
        <div className="absolute top-4 right-14 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-2.5 py-1 text-xs text-slate-500 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {feederCount} feeders - live
        </div>
      )}

      {loading && (
        <div className="absolute top-4 right-14 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-2.5 py-1 text-xs text-slate-500 shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading map data...
        </div>
      )}

      <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-2">

        <Button
          size="icon"
          variant="secondary"
          onClick={handleGPS}
          className="h-9 w-9 bg-white shadow-md border border-slate-200 hover:bg-slate-50"
          title="Centre on my location"
        >
          <Locate className="h-4 w-4 text-slate-600" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={onToggleStyle}
          className="h-9 w-9 bg-white shadow-md border border-slate-200 hover:bg-slate-50"
          title={style === "streets" ? "Satellite view" : "Streets view"}
        >
          <Layers className="h-4 w-4 text-slate-600" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={onToggleHeatmap}
          className={cn(
            "h-9 w-9 shadow-md border transition-colors",
            heatmap
              ? "bg-iesco-navy border-iesco-navy text-white hover:bg-iesco-navy/90"
              : "bg-white border-slate-200 hover:bg-slate-50"
          )}
          title={heatmap ? "Hide reliability heatmap" : "Show reliability heatmap"}
        >
          <Map className={cn("h-4 w-4", heatmap ? "text-white" : "text-slate-600")} />
        </Button>

      </div>
    </>
  )
}
