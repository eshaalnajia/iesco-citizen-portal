import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api                       from "@/services/api"

export async function submitRequest(payload) {
  const { data } = await api.post("/service-requests/", payload)
  return data
}

export async function trackRequest(ticketNumber) {
  const { data } = await api.get(`/service-requests/track/${ticketNumber}`)
  return data
}

export async function confirmRequestCompletion(ticketNumber, completed) {
  const { data } = await api.post(
    `/service-requests/track/${ticketNumber}/confirm`,
    null,
    { params: { completed } }
  )
  return data
}

export function useSubmitServiceRequest() {
  return useMutation({ mutationFn: submitRequest })
}

export function useTrackRequest(ticketNumber) {
  return useQuery({
    queryKey:  ["service-request", ticketNumber],
    queryFn:   () => trackRequest(ticketNumber),
    enabled:   !!ticketNumber && ticketNumber.startsWith("SR-"),
    staleTime: 1000 * 60 * 2,
    retry:     false,
  })
}

export function useConfirmRequest(ticketNumber) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (completed) => confirmRequestCompletion(ticketNumber, completed),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["service-request", ticketNumber] }),
  })
}