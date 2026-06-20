import { useRef, useState, useCallback } from "react"
import { useMapbox }           from "@/hooks/useMapbox"
import { useFeederLayer }      from "@/hooks/useFeederLayer"
import { useRealtimeFeeders }  from "@/hooks/useRealtimeFeeders"
import { MapLegend }           from "@/components/map/MapLegend"
import { MapPopup }            from "@/components/map/MapPopup"
import { MapControls }         from "@/components/map/MapControls"
import { useTranslation }      from "react-i18next"
import { Loader2, WifiOff }    from "lucide-react"

export default function MapPage() {
  const { t } = useTranslation()

  const containerRef = useRef(null)
  const [selectedFeeder, setSelectedFeeder] = useState(null)

  const { feeders, loading, error } = useRealtimeFeeders()
  const { map, ready, style, toggleStyle } = useMapbox(containerRef)

  const handleFeederClick = useCallback((feeder) => {
    setSelectedFeeder(feeder)
  }, [])

  const { updateFeederStatus } = useFeederLayer(
    map, ready, feeders, handleFeederClick
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-3 text-slate-500">
        <WifiOff className="h-8 w-8" />
        <p className="text-sm">Could not load feeder data: {error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {(!ready || loading) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100 rounded-lg">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-iesco-teal" />
            <p className="text-sm">Loading feeder map...</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-[calc(100vh-3.5rem)] rounded-lg overflow-hidden"
        aria-label="IESCO feeder status map of Islamabad"
      />

      <MapLegend />
      <MapPopup
        feeder={selectedFeeder}
        onClose={() => setSelectedFeeder(null)}
      />
      <MapControls
        map={map}
        style={style}
        onToggleStyle={toggleStyle}
      />

      {ready && !loading && (
        <div className="absolute top-4 right-14 z-10 flex items-center gap-1.5
                        bg-white/90 backdrop-blur-sm border border-slate-200
                        rounded-full px-2.5 py-1 text-xs text-slate-500 shadow-sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {feeders.length} feeders · live
        </div>
      )}
    </div>
  )
}
