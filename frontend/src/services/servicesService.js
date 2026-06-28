import api from "@/services/api"

export async function getProviderTypes() {
  const { data } = await api.get("/services/types")
  return data
}

export async function getProviders({
  providerType,
  area,
  search,
  verifiedOnly  = true,
  availableOnly = true,
  minRating,
  page          = 1,
  pageSize      = 20,
} = {}) {
  const { data } = await api.get("/services/", {
    params: {
      provider_type:  providerType,
      area,
      search,
      verified_only:  verifiedOnly,
      available_only: availableOnly,
      min_rating:     minRating,
      page,
      page_size:      pageSize,
    },
  })
  return data
}

export async function getProvider(providerId) {
  const { data } = await api.get(`/services/${providerId}`)
  return data
}

export async function getServiceAreas() {
  const { data } = await api.get("/services/areas")
  return data
}

export async function submitRating(providerId, rating, comment = "") {
  const { data } = await api.post(`/services/${providerId}/rating`, {
    rating,
    comment: comment || undefined,
  })
  return data
}
