import { useEffect, useCallback, useRef } from "react"
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

  const featureIndexRef = useRef({}) // feederUUID -> feature array index

  // ---- ONE-TIME SETUP: source, layers, event listeners ----
  // Only re-runs if the map instance, readiness, the underlying geojson shape,
  // or the click handler identity changes - NOT on every realtime feeders update.
  useEffect(() => {
    if (!map || !ready || !geojson) return

    const normalized = {
      ...geojson,
      features: geojson.features.map((f) => ({
        ...f,
        id: f.id ?? f.properties?.id,
      })),
    }

    const index = {}
    normalized.features.forEach((f, idx) => {
      const feederUUID = f.properties?.id
      if (feederUUID) index[feederUUID] = idx
    })
    featureIndexRef.current = index

    if (!map.getSource("feeders")) {
      map.addSource("feeders", { type: "geojson", data: normalized, generateId: true })
    } else {
      map.getSource("feeders").setData(normalized)
    }

    const applyInitialStatuses = () => {
      if (!feeders?.length) return
      feeders.forEach((f) => {
        const idx = featureIndexRef.current[f.id]
        if (idx === undefined) return
        try {
          map.setFeatureState(
            { source: "feeders", id: idx },
            { status: f.status, hover: false }
          )
        } catch (_) {}
      })
    }

    if (map.isSourceLoaded("feeders")) {
      applyInitialStatuses()
    } else {
      map.once("sourcedata", (e) => {
        if (e.sourceId === "feeders" && e.isSourceLoaded) applyInitialStatuses()
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

    function handleMouseMove(e) {
      if (!e.features.length) return
      map.getCanvas().style.cursor = "pointer"
      if (hoveredId !== null) map.setFeatureState({ source: "feeders", id: hoveredId }, { hover: false })
      hoveredId = e.features[0].id
      map.setFeatureState({ source: "feeders", id: hoveredId }, { hover: true })
    }

    function handleMouseLeave() {
      map.getCanvas().style.cursor = ""
      if (hoveredId !== null) {
        map.setFeatureState({ source: "feeders", id: hoveredId }, { hover: false })
        hoveredId = null
      }
    }

    function handleClick(e) {
      if (!e.features.length) return
      const props  = e.features[0].properties
      const feeder = feeders?.find((f) => f.id === props.id || f.feeder_code === props.feeder_code)
      if (feeder && onFeederClick) onFeederClick(feeder)
    }

    function handleStyleData() {
      if (!map.getSource("feeders")) {
        map.addSource("feeders", { type: "geojson", data: normalized })
      }
    }

    map.on("mousemove", "feeder-fill", handleMouseMove)
    map.on("mouseleave", "feeder-fill", handleMouseLeave)
    map.on("click", "feeder-fill", handleClick)
    map.on("styledata", handleStyleData)

    return () => {
      map.off("mousemove", "feeder-fill", handleMouseMove)
      map.off("mouseleave", "feeder-fill", handleMouseLeave)
      map.off("click", "feeder-fill", handleClick)
      map.off("styledata", handleStyleData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, geojson, onFeederClick])

  // ---- CHEAP STATUS SYNC: runs whenever feeders array changes (realtime
  // updates, admin edits) - only touches feature-state on the specific
  // feeders whose status actually differs, never rebuilds source/layers ----
  useEffect(() => {
    if (!map || !ready || !feeders?.length) return
    if (!map.getSource("feeders") || !map.isSourceLoaded("feeders")) return

    feeders.forEach((f) => {
      const idx = featureIndexRef.current[f.id]
      if (idx === undefined) return
      try {
        map.setFeatureState(
          { source: "feeders", id: idx },
          { status: f.status }
        )
      } catch (_) {}
    })
  }, [map, ready, feeders])

  const updateFeederStatus = useCallback((feederId, newStatus) => {
    if (!map || !map.getSource("feeders")) return
    const idx = featureIndexRef.current[feederId]
    if (idx === undefined) return
    map.setFeatureState({ source: "feeders", id: idx }, { status: newStatus })
  }, [map])

  return { updateFeederStatus }
}