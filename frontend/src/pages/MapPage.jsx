import {
  useRef, useState, useCallback, useEffect
} from "react"
import { useSearchParams }        from "react-router-dom"
import { useMapbox }              from "@/hooks/useMapbox"
import { useFeederLayer }         from "@/hooks/useFeederLayer"
import { useRealtimeFeeders }     from "@/hooks/useRealtimeFeeders"
import { useHeatmapLayer }        from "@/components/map/HeatmapLayer"
import { MapLegend }              from "@/components/map/MapLegend"
import { MapFeederPopup }         from "@/components/map/MapFeederPopup"
import { MapControls }            from "@/components/map/MapControls"
import { MobileBottomSheet }      from "@/components/map/MobileBottomSheet"
import { ZoneSearch }             from "@/components/map/ZoneSearch"
import { getRestorationInfo }     from "@/utils/restorationTime"
import { useQuery }               from "@tanstack/react-query"
import { Loader2 }                from "lucide-react"
import api                        from "@/services/api"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])
  return isMobile
}

function RealtimeIndicator({ status }) {
  const config = {
    connected:    { dot: "bg-green-500 animate-pulse", label: "Live"          },
    connecting:   { dot: "bg-amber-400 animate-pulse", label: "Connecting..." },
    reconnecting: { dot: "bg-amber-400 animate-pulse", label: "Reconnecting..." },
    disconnected: { dot: "bg-red-500",                 label: "Offline"       },
  }[status] ?? { dot: "bg-slate-400", label: "" }

  return (
    <div className="absolute top-4 right-14 z-10 flex items-center gap-1.5
                    bg-white/90 backdrop-blur-sm border border-slate-200
                    rounded-full px-2.5 py-1 text-xs text-slate-500 shadow-sm">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </div>
  )
}

export default function MapPage() {
  const containerRef                    = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedFeeder, setSelected]   = useState(null)
  const [heatmap, setHeatmap]           = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const isMobile                        = useIsMobile()

  const { feeders, loading, error, realtimeStatus } = useRealtimeFeeders()
  const { map, ready, style, toggleStyle } = useMapbox(containerRef)

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
  const { data: scheduleData } = useQuery({
    queryKey:  ["popup-schedule", selectedFeeder?.id],
    queryFn:   () => api.get("/schedules/feeder/" + selectedFeeder.id, {
      params: { days_ahead: 1 }
    }).then(r => r.data),
    enabled:   !!selectedFeeder?.id,
    staleTime: 1000 * 60 * 2,
  })

  const todaySchedules = scheduleData?.data?.filter(
    (s) => s.schedule_date === today
  ) ?? []

  const restorationInfo = selectedFeeder
    ? getRestorationInfo(selectedFeeder, todaySchedules)
    : null

  const handleFeederClick = useCallback((feeder) => {
    setSelected(feeder)
    setSearchParams({ feeder: feeder.feeder_code }, { replace: true })
  }, [setSearchParams])

  const handleClose = useCallback(() => {
    setSelected(null)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  useFeederLayer(map, ready, feeders, handleFeederClick)
  useHeatmapLayer(map, ready, feeders, heatmap)

  useEffect(() => {
    if (!map || !ready) return
    const visibility = heatmap ? "none" : "visible"
    if (map.getLayer("feeder-fill"))   map.setLayoutProperty("feeder-fill",   "visibility", visibility)
    if (map.getLayer("feeder-stroke")) map.setLayoutProperty("feeder-stroke", "visibility", visibility)
  }, [map, ready, heatmap])

  useEffect(() => {
    if (loading) return
    const code = searchParams.get("feeder")
    if (code && feeders.length > 0 && !selectedFeeder) {
      const feeder = feeders.find((f) => f.feeder_code === code)
      if (feeder) setSelected(feeder)
    }
  }, [feeders, searchParams, selectedFeeder, loading])

  useEffect(() => {
    if (!map || !ready) return
    function onMapClick(e) {
      const hits = map.queryRenderedFeatures(e.point, { layers: ["feeder-fill"] })
      if (hits.length === 0) handleClose()
    }
    map.on("click", onMapClick)
    return () => map.off("click", onMapClick)
  }, [map, ready, handleClose])

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && selectedFeeder) handleClose()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [selectedFeeder, handleClose])

  useEffect(() => { if (heatmap) handleClose() }, [heatmap])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    }, () => {}, { enableHighAccuracy: false, timeout: 5000 })
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
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
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        tabIndex={0}
        className="w-full outline-none"
        style={{ height: "calc(100vh - 3.5rem)" }}
        aria-label="IESCO live electricity status map of Islamabad"
      />

      <ZoneSearch map={map} />
      <RealtimeIndicator status={realtimeStatus} />

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
        isMobile ? (
          <MobileBottomSheet
            feeder={selectedFeeder}
            restorationInfo={restorationInfo}
            todaySchedules={todaySchedules}
            userLocation={userLocation}
            onClose={handleClose}
          />
        ) : (
          <MapFeederPopup
            feeder={selectedFeeder}
            restorationInfo={restorationInfo}
            todaySchedules={todaySchedules}
            userLocation={userLocation}
            onClose={handleClose}
          />
        )
      )}

    </div>
  )
}


