import { useEffect, useCallback, useRef } from "react"
import { STATUS_COLORS } from "@/lib/mapConstants"

export function useFeederLayer(map, ready, feeders, onFeederClick) {
  const hoveredIdRef = useRef(null)

  const colorExpression = [
    "match",
    ["get", "status"],
    ...Object.entries(STATUS_COLORS).flatMap(([k, v]) => [k, v]),
    STATUS_COLORS.no_data,
  ]

  const addLayers = useCallback((map, geojson) => {
    if (map.getSource("feeders")) {
      map.getSource("feeders").setData(geojson)
    } else {
      map.addSource("feeders", {
        type: "geojson",
        data: geojson,
        generateId: true,
      })
    }

    if (!map.getLayer("feeder-fill")) {
      map.addLayer({
        id:     "feeder-fill",
        type:   "fill",
        source: "feeders",
        paint: {
          "fill-color":   colorExpression,
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.8,
            0.55,
          ],
        },
      })
    }

    if (!map.getLayer("feeder-stroke")) {
      map.addLayer({
        id:     "feeder-stroke",
        type:   "line",
        source: "feeders",
        paint: {
          "line-color":   "#1e293b",
          "line-width":   1.5,
          "line-opacity": 0.9,
        },
      })
    }

    map.on("mousemove", "feeder-fill", (e) => {
      if (e.features.length === 0) return
      map.getCanvas().style.cursor = "pointer"

      const newId = e.features[0].id
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== newId) {
        map.setFeatureState(
          { source: "feeders", id: hoveredIdRef.current },
          { hover: false }
        )
      }
      if (newId !== undefined && hoveredIdRef.current !== newId) {
        map.setFeatureState(
          { source: "feeders", id: newId },
          { hover: true }
        )
        hoveredIdRef.current = newId
      }
    })

    map.on("mouseleave", "feeder-fill", () => {
      map.getCanvas().style.cursor = ""
      if (hoveredIdRef.current !== null) {
        map.setFeatureState(
          { source: "feeders", id: hoveredIdRef.current },
          { hover: false }
        )
        hoveredIdRef.current = null
      }
    })

    map.on("click", "feeder-fill", (e) => {
      if (e.features.length === 0) return
      const props  = e.features[0].properties
      if (onFeederClick) onFeederClick(props, [e.lngLat.lng, e.lngLat.lat])
    })
  }, [colorExpression, onFeederClick])

  useEffect(() => {
    if (!map || !ready) return
    fetch(`${import.meta.env.VITE_API_URL}/feeders/map/geojson`)
      .then((r) => r.json())
      .then((geojson) => {
        if (map.isStyleLoaded()) {
          addLayers(map, geojson)
        } else {
          map.once("load", () => addLayers(map, geojson))
        }
      })
  }, [map, ready, addLayers])

  return { updateFeederStatus: () => {} }
}
