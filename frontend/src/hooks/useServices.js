import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  getProviders,
  getProvider,
  getServiceAreas,
  submitRating,
} from "@/services/servicesService"

export const serviceKeys = {
  all:     ()                            => ["services"],
  list:    (type, area, search, page)    => ["services", "list", type, area, search, page],
  single:  (id)                          => ["services", "single", id],
  areas:   ()                            => ["services", "areas"],
}

export function useProviders({ providerType, area, search, page = 1 } = {}) {
  return useQuery({
    queryKey:         serviceKeys.list(providerType, area, search, page),
    queryFn:          () => getProviders({ providerType, area, search, page }),
    staleTime:        1000 * 60 * 10,
    placeholderData:  keepPreviousData,
  })
}

export function useProvider(providerId) {
  return useQuery({
    queryKey:  serviceKeys.single(providerId),
    queryFn:   () => getProvider(providerId),
    enabled:   !!providerId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useServiceAreas() {
  return useQuery({
    queryKey:  serviceKeys.areas(),
    queryFn:   getServiceAreas,
    staleTime: 1000 * 60 * 60,
  })
}

export function useSubmitRating() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ providerId, rating, comment }) =>
      submitRating(providerId, rating, comment),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all() })
      queryClient.invalidateQueries({ queryKey: serviceKeys.single(providerId) })
    },
  })
}
