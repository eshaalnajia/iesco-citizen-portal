import { useEffect } from "react"

// Status -> reliability score for feeders without an explicit score
const STATUS_RELIABILITY = {
  on:            95,
  shedding_soon: 70,
  load_shedding: 50,
  fault:         20,
  maintenance:   60,
  no_data:       50,
}

export function useHeatmapLayer(map, ready, feeders, enabled) {
  useEffect(() => {
    if (!map || !ready) return

    const sourceId = "feeders-heat"
    const layerId  = "feeder-heatmap"

    if (!enabled) {
      if (map.getLayer(layerId))  map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
      return
    }

    const points = {
      type: "FeatureCollection",
      features: feeders
        .filter((f) => f.boundary)
        .map((f) => {
          const score = f.reliability ?? STATUS_RELIABILITY[f.status] ?? 50
          return {
            type: "Feature",
            properties: {
              reliability: score,
              weight: (100 - score) / 100,
            },
            geometry: {
              type: "Point",
              coordinates: deriveFeederCenter(f),
            },
          }
        })
        .filter((f) => f.geometry.coordinates !== null),
    }

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(points)
    } else {
      map.addSource(sourceId, { type: "geojson", data: points })
    }

    if (!map.getLayer(layerId)) {
      map.addLayer(
        {
          id:     layerId,
          type:   "heatmap",
          source: sourceId,
          paint: {
            "heatmap-weight": [
              "interpolate", ["linear"],
              ["get", "weight"],
              0, 0,
              1, 1,
            ],
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              8, 1, 14, 3,
            ],
            "heatmap-color": [
              "interpolate", ["linear"],
              ["heatmap-density"],
              0,    "rgba(34,197,94,0)",
              0.2,  "rgba(34,197,94,0.6)",
              0.4,  "rgba(234,179,8,0.7)",
              0.6,  "rgba(249,115,22,0.8)",
              0.8,  "rgba(239,68,68,0.9)",
              1,    "rgba(185,28,28,1)",
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              8, 30, 14, 60,
            ],
            "heatmap-opacity": 0.7,
          },
        },
        "feeder-fill"
      )
    }
  }, [map, ready, feeders, enabled])
}

// Rough feeder centre - replace with PostGIS ST_Centroid in production
const FEEDER_CENTERS = {
  "G11-E": [73.0090, 33.6940],
  "G11-W": [72.9890, 33.6940],
  "F10-N": [73.0150, 33.7030],
  "F10-S": [73.0150, 33.6950],
  "G9-M":  [73.0200, 33.6850],
  "I8-A":  [73.0550, 33.6760],
  "I8-B":  [73.0600, 33.6700],
  "E7-1":  [73.0450, 33.7215],
  "H8-1":  [73.0500, 33.6840],
  "BT-1":  [73.1800, 33.5500],
  "DHA-1": [73.1300, 33.5200],
  "WAH-1": [72.7600, 33.7700],
}

function deriveFeederCenter(feeder) {
  return FEEDER_CENTERS[feeder.feeder_code] ?? null
}
