import { useEffect, useCallback } from "react"
import { STATUS_COLORS }          from "@/lib/mapConstants"

export function useFeederLayer(map, ready, feeders, geojson, onFeederClick) {

  const colorExpression = [
    "match", ["feature-state", "status"],
    "on",            STATUS_COLORS.on,
    "shedding_soon", STATUS_COLORS.shedding_soon,
    "load_shedding", STATUS_COLORS.load_shedding,
    "fault",         STATUS_COLORS.fault,
    "maintenance",   STATUS_COLORS.maintenance,
    STATUS_COLORS.no_data,
  ]

  useEffect(() => {
    if (!map || !ready || !geojson) return

    const normalized = {
      ...geojson,
      features: geojson.features.map((f) => ({
        ...f,
        id: f.id ?? f.properties?.id,
      })),
    }

    if (!map.getSource("feeders")) {
      map.addSource("feeders", { type: "geojson", data: normalized, generateId: true })
    } else {
      map.getSource("feeders").setData(normalized)
    }

    const applyStatuses = () => {
      if (!feeders?.length) return
      const statusMap = Object.fromEntries(feeders.map(f => [f.id, f.status]))
      normalized.features.forEach((f, idx) => {
        const feederUUID = f.properties?.id
        const status = statusMap[feederUUID]
        if (status) {
          try {
            map.setFeatureState(
              { source: "feeders", id: idx },
              { status, hover: false }
            )
          } catch (_) {}
        }
      })
    }

    if (map.isSourceLoaded("feeders")) {
      applyStatuses()
    } else {
      map.once("sourcedata", (e) => {
        if (e.sourceId === "feeders" && e.isSourceLoaded) applyStatuses()
      })
    }

    if (!map.getLayer("feeder-fill")) {
      map.addLayer({
        id: "feeder-fill", type: "fill", source: "feeders",
        paint: {
          "fill-color":   colorExpression,
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.80, 0.45],
          "fill-antialias": true,
        },
      })
    }

    if (!map.getLayer("feeder-stroke")) {
      map.addLayer({
        id: "feeder-stroke", type: "line", source: "feeders",
        paint: {
          "line-color":   colorExpression,
          "line-width":   ["case", ["boolean", ["feature-state", "hover"], false], 3.0, 1.5],
          "line-opacity": 0.9,
        },
      })
    }

    if (!map.getLayer("feeder-label")) {
      map.addLayer({
        id: "feeder-label", type: "symbol", source: "feeders",
        layout: {
          "text-field":         ["get", "sector"],
          "text-size":          11,
          "text-font":          ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-anchor":        "center",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color":      "#0D1B3E",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
          "text-halo-blur":  0.5,
        },
      })
    }

    let hoveredId = null

    map.on("mousemove", "feeder-fill", (e) => {
      if (!e.features.length) return
      map.getCanvas().style.cursor = "pointer"
      if (hoveredId !== null) map.setFeatureState({ source: "feeders", id: hoveredId }, { hover: false })
      hoveredId = e.features[0].id
      map.setFeatureState({ source: "feeders", id: hoveredId }, { hover: true })
    })

    map.on("mouseleave", "feeder-fill", () => {
      map.getCanvas().style.cursor = ""
      if (hoveredId !== null) {
        map.setFeatureState({ source: "feeders", id: hoveredId }, { hover: false })
        hoveredId = null
      }
    })

    map.on("click", "feeder-fill", (e) => {
      if (!e.features.length) return
      const props  = e.features[0].properties
      const feeder = feeders?.find((f) => f.id === props.id || f.feeder_code === props.feeder_code)
      if (feeder && onFeederClick) onFeederClick(feeder)
    })

    map.on("styledata", () => {
      if (!map.getSource("feeders")) {
        map.addSource("feeders", { type: "geojson", data: normalized })
      }
    })
  }, [map, ready, feeders, geojson, onFeederClick])

  const updateFeederStatus = useCallback((feederId, newStatus) => {
    if (!map || !map.getSource("feeders")) return
    map.setFeatureState({ source: "feeders", id: feederId }, { status: newStatus })
  }, [map])

  return { updateFeederStatus }
}