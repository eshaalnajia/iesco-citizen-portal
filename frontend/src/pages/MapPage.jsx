import { useRef, useState, useCallback, useEffect } from "react"
import { useMapbox }            from "@/hooks/useMapbox"
import { useFeederLayer }       from "@/hooks/useFeederLayer"
import { useRealtimeFeeders }   from "@/hooks/useRealtimeFeeders"
import { useHeatmapLayer }      from "@/components/map/HeatmapLayer"
import { MapLegend }            from "@/components/map/MapLegend"
import { MapFeederPopup }       from "@/components/map/MapFeederPopup"
import { MapControls }          from "@/components/map/MapControls"
import { Loader2 }              from "lucide-react"

export default function MapPage() {
  const containerRef                  = useRef(null)
  const [selectedFeeder, setSelected] = useState(null)
  const [heatmap, setHeatmap]         = useState(false)

  const { feeders, loading, error } = useRealtimeFeeders()

  const { map, ready, style, toggleStyle } = useMapbox(containerRef)

  const handleFeederClick = useCallback((feeder) => {
    setSelected(feeder)
  }, [])

  useFeederLayer(map, ready, feeders, handleFeederClick)

  useHeatmapLayer(map, ready, feeders, heatmap)

  useEffect(() => {
    if (!map || !ready) return
    const visibility = heatmap ? "none" : "visible"
    if (map.getLayer("feeder-fill")) map.setLayoutProperty("feeder-fill", "visibility", visibility)
    if (map.getLayer("feeder-stroke")) map.setLayoutProperty("feeder-stroke", "visibility", visibility)
  }, [map, ready, heatmap])

  useEffect(() => {
    if (heatmap) setSelected(null)
  }, [heatmap])

  useEffect(() => {
    if (!map || !ready) return
    function handleMapClick(e) {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["feeder-fill"],
      })
      if (features.length === 0) setSelected(null)
    }
    map.on("click", handleMapClick)
    return () => map.off("click", handleMapClick)
  }, [map, ready])

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] text-slate-500">
        <p className="text-sm">Could not load feeder data: {error}</p>
      </div>
    )
  }

  return (
    <div className="relative -mx-4">

      {(!ready || loading) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-iesco-teal" />
            <p className="text-sm">Loading feeder map...</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full"
        style={{ height: "calc(100vh - 3.5rem)" }}
        aria-label="IESCO live electricity status map of Islamabad"
      />

      <MapLegend heatmap={heatmap} />

      <MapControls
        map={map}
        style={style}
        onToggleStyle={toggleStyle}
        heatmap={heatmap}
        onToggleHeatmap={() => setHeatmap((v) => !v)}
        loading={!ready || loading}
        feederCount={feeders.filter((f) => f.boundary).length}
      />

      {selectedFeeder && !heatmap && (
        <MapFeederPopup
          feeder={selectedFeeder}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  )
}
