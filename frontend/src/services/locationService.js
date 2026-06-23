import api from "@/services/api"

export async function getLocationSectors() {
  const { data } = await api.get("/locations/sectors")
  return data
}

export async function getLocations({ search, areaType, page = 1, pageSize = 30 } = {}) {
  const { data } = await api.get("/locations/", {
    params: {
      search,
      area_type: areaType,
      page,
      page_size: pageSize,
    },
  })
  return data
}

export async function getLocation(locationId) {
  const { data } = await api.get(`/locations/${locationId}`)
  return data
}

export async function getNearestLocations(lat, lng, limit = 3) {
  const { data } = await api.get("/locations/nearest", {
    params: { lat, lng, limit },
  })
  return data
}
