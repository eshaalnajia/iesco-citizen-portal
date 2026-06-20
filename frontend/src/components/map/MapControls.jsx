import { Locate, Layers } from "lucide-react"
import { FEEDER_ZOOM } from "@/lib/mapConstants"

export function MapControls({ map, style, onToggleStyle }) {
  function handleGPS() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom:   FEEDER_ZOOM,
          speed:  1.4,
        })
      },
      () => {
        alert("Unable to get your location. Please check location permissions.")
      }
    )
  }

  const btnClass = "h-9 w-9 flex items-center justify-center bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 cursor-pointer"

  return (
    <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-2">
      <button onClick={handleGPS} className={btnClass} title="Centre on my location">
        <Locate className="h-4 w-4 text-slate-600" />
      </button>
      <button onClick={onToggleStyle} className={btnClass} title={style === "streets" ? "Switch to satellite" : "Switch to streets"}>
        <Layers className="h-4 w-4 text-slate-600" />
      </button>
    </div>
  )
}
