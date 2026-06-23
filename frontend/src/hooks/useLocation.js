import { useQuery } from "@tanstack/react-query"
import {
  getLocationSectors,
  getLocations,
  getLocation,
  getNearestLocations,
} from "@/services/locationService"

export const locationKeys = {
  all:     ()                      => ["locations"],
  sectors: ()                      => ["locations", "sectors"],
  list:    (search, type, page)    => ["locations", "list", search, type, page],
  single:  (id)                    => ["locations", "single", id],
  nearest: (lat, lng)              => ["locations", "nearest", lat, lng],
}

export function useLocationSectors() {
  return useQuery({
    queryKey:  locationKeys.sectors(),
    queryFn:   getLocationSectors,
    staleTime: 1000 * 60 * 60,
  })
}

export function useLocations({ search, areaType, page = 1 } = {}) {
  return useQuery({
    queryKey:  locationKeys.list(search, areaType, page),
    queryFn:   () => getLocations({ search, areaType, page }),
    staleTime: 1000 * 60 * 60,
    keepPreviousData: true,
  })
}

export function useLocation(locationId) {
  return useQuery({
    queryKey: locationKeys.single(locationId),
    queryFn:  () => getLocation(locationId),
    enabled:  !!locationId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useNearestLocations(lat, lng, enabled = false) {
  return useQuery({
    queryKey:  locationKeys.nearest(lat, lng),
    queryFn:   () => getNearestLocations(lat, lng, 3),
    enabled:   enabled && !!lat && !!lng,
    staleTime: 1000 * 60 * 5,
  })
}
