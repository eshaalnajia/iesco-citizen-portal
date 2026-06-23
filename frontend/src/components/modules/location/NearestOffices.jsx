import { useState }            from "react"
import { useNearestLocations } from "@/hooks/useLocation"
import { LocationCard }        from "./LocationCard"
import { Button }              from "@/components/ui/button"
import { Locate, Loader2, MapPinOff } from "lucide-react"

export function NearestOffices() {
  const [coords, setCoords]     = useState(null)
  const [gpsError, setGpsError] = useState(null)
  const [finding, setFinding]   = useState(false)

  const { data, isLoading } = useNearestLocations(
    coords?.lat,
    coords?.lng,
    !!coords,
  )

  function handleFindNearest() {
    if (!navigator.geolocation) {
      setGpsError("Your browser does not support location access.")
      return
    }

    setFinding(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setFinding(false)
      },
      (err) => {
        setFinding(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError("Location permission denied. Enable it in your browser settings.")
            break
          case err.POSITION_UNAVAILABLE:
            setGpsError("Your location could not be determined. Try again.")
            break
          case err.TIMEOUT:
            setGpsError("Location request timed out. Try again.")
            break
          default:
            setGpsError("Could not get your location.")
        }
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFindNearest}
          disabled={finding || isLoading}
          className="flex items-center gap-2"
        >
          {finding || isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Locate className="h-4 w-4" />
          }
          {coords ? "Refresh location" : "Find offices near me"}
        </Button>

        {coords && !isLoading && (
          <p className="text-xs text-slate-400">
            Showing nearest 3 offices to your location
          </p>
        )}
      </div>

      {gpsError && (
        <div className="flex items-start gap-2 text-sm text-red-600
                        bg-red-50 border border-red-200 rounded-lg p-3">
          <MapPinOff className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{gpsError}</p>
        </div>
      )}

      {coords && isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {data?.data && data.data.length > 0 && (
        <div className="space-y-3">
          {data.data.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              distance={loc.distance_km}
            />
          ))}
        </div>
      )}
    </div>
  )
}
