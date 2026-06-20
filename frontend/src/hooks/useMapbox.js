import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ISLAMABAD_CENTER, ISLAMABAD_ZOOM, FEEDER_ZOOM, MAP_STYLES } from "@/lib/mapConstants"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export function useMapbox(containerRef) {
  const mapRef        = useRef(null)
  const [ready, setReady] = useState(false)
  const [style, setStyle] = useState("streets")

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAP_STYLES.streets,
      center:    ISLAMABAD_CENTER,
      zoom:      ISLAMABAD_ZOOM,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl(), "top-right")
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right")

    map.on("load", () => {
      mapRef.current = map
      setReady(true)

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom:   FEEDER_ZOOM,
              speed:  0.8,
            })
          },
          () => {
            console.info("Geolocation unavailable — showing Islamabad default view")
          },
          {
            timeout:           5000,
            maximumAge:        60000,
            enableHighAccuracy: false,
          }
        )
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [containerRef])

  function toggleStyle() {
    const newStyle = style === "streets" ? "satellite" : "streets"
    setStyle(newStyle)
    mapRef.current?.setStyle(MAP_STYLES[newStyle])
  }

  return { map: mapRef.current, ready, style, toggleStyle }
}
